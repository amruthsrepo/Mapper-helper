var dataObjects = {}

var readFile = () => {
    let selectedFile = document.getElementById("mapFileSelect").files[0]
    let fileName = selectedFile.name
    if (fileName.endsWith('.map')) {
        var fr = new FileReader()
        var parser = new DOMParser()
        dataObjects['Links'] = { in: [], out: [], any: [] }
        dataObjects['Params'] = {}
        dataObjects['Functions'] = {}
        dataObjects['Xlsx'] = { index: new Set(), sheets: {} }
        $('#functionsList').html('')
        fr.onload = function () {
            $('#mapFileSelectLabel').html(fileName)
            dataObjects.mapToXml = parser.parseFromString(fr.result, "text/xml")
            _ = [...dataObjects.mapToXml.getElementsByTagName('Links')[0].children].map(l => {
                dataObjects.Links.out.push(l.children[0].attributes.IDREF.value)
                dataObjects.Links.in.push(l.children[1].attributes.IDREF.value)
                dataObjects.Links.any.push(l.children[0].attributes.IDREF.value)
                dataObjects.Links.any.push(l.children[1].attributes.IDREF.value)
            })
            _ = [...dataObjects.mapToXml.getElementsByTagName('Parameters')[0].children].map(p => {
                let fid = p.children[6].attributes.IDREF.value, type = p.children[2].innerHTML == 'I',
                    name = p.children[1].innerHTML, desc = p.children[3].innerHTML, IID = p.children[7].attributes.ID.value
                if (dataObjects.Params[fid] == undefined && dataObjects.Links.any.includes(IID)) {
                    dataObjects.Params[fid] = { in: [], out: [] }
                    if (type) {
                        dataObjects.Params[fid].in.push({
                            name: name,
                            desc: desc,
                            iid: IID
                        })
                    } else {
                        dataObjects.Params[fid].out.push({
                            name: name,
                            desc: desc,
                            iid: IID
                        })
                    }
                } else if (dataObjects.Links.any.includes(IID)) {
                    if (type) {
                        dataObjects.Params[fid].in.push({
                            name: name,
                            desc: desc,
                            iid: IID
                        })
                    } else {
                        dataObjects.Params[fid].out.push({
                            name: name,
                            desc: desc,
                            iid: IID
                        })
                    }
                }
            })
            let allFuncList = [...dataObjects.mapToXml.getElementsByTagName('Functions')[0].children].
                filter(x => /\/.+\/.+/.test(x.getElementsByTagName('PATH')[0].innerHTML))
            allFuncList.map(y => {
                let fName = y.getElementsByTagName('PATH')[0].innerHTML, fID = y.children[5].attributes.ID.value
                dataObjects.Functions[fName] = {
                    API: fName,
                    ioFields: dataObjects.Params[fID]
                }
                $('#functionsList').append(getInfoTableAndXlsxFormat(fName, dataObjects.Params[fID]))
            })
            dataObjects.functionListNodes = allFuncList
        }
        fr.readAsText(selectedFile)
    } else {
        alert('Please select a .map file')
    }
}

var getInfoTableAndXlsxFormat = (name, ioFields) => {
    let mainList = document.createElement('li')
    let outerDiv = document.createElement('div')
    let inputListDiv = document.createElement('div')
    let outputListDiv = document.createElement('div')
    let inputList = document.createElement('ul')
    let outputList = document.createElement('ul')
    outerDiv.classList.add('row')
    inputListDiv.classList.add('col-sm-6')
    outputListDiv.classList.add('col-sm-6')
    $(mainList).append('<h5>' + name + '</h5>')
    $(mainList).append(outerDiv)
    let xlsxSheet = [
        [{ A: 'Go to Index' }],
        [{ A: '' }, { B: "Input field", C: "Description" }],
        [{ A: '' }, { B: "Output field", C: "Description" }]
    ]
    try {
        ioFields.in.map(i => {
            $(inputList).append('<li>' + i.name + ': ' + i.desc + '</li>')
            xlsxSheet[1].push({ B: i.name, C: i.desc })
        })
        $(inputListDiv).append('InputFields')
        $(inputListDiv).append(inputList)
        $(outerDiv).append(inputListDiv)
        dataObjects.Xlsx.sheets[name] = [...xlsxSheet[0], ...xlsxSheet[1], ...xlsxSheet[2]]
        dataObjects.Xlsx.index.add(name)
    } catch (e) {
        console.log('No Input Fields for: ' + name)
    }
    try {
        ioFields.out.map(i => {
            $(outputList).append('<li>' + i.name + ': ' + i.desc + '</li>')
            xlsxSheet[2].push({ B: i.name, C: i.desc })
        })
        $(outputListDiv).append('OutputFields')
        $(outputListDiv).append(outputList)
        $(outerDiv).append(outputListDiv)
        dataObjects.Xlsx.sheets[name] = [...xlsxSheet[0], ...xlsxSheet[1], ...xlsxSheet[2]]
        dataObjects.Xlsx.index.add(name)
    } catch (e) {
        console.log('No Input Fields for: ' + name)
    }
    return mainList
}

var s2ab = s => {
    let buf = new ArrayBuffer(s.length)
    let view = new Uint8Array(buf)
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF
    return buf
}

var downloadXLSX = fileName => {
    let sheetNames = Array.from(dataObjects.Xlsx.index), indexSheet = {}, rowNumber = 1
    let wb = XLSX.utils.book_new()
    wb.SheetNames.push('Index')
    for (let sheetName of sheetNames) {
        let cleanName = sheetName.substr(1).replace('/', '_')
        wb.SheetNames.push(cleanName)
        let ws = XLSX.utils.json_to_sheet(dataObjects.Xlsx.sheets[sheetName], { header: [], skipHeader: true })
        ws['!cols'] = [{ width: 10 }, { width: 10 }, { width: 50 }]
        ws['A1'].l = { Target: "#Index!A" + rowNumber }
        wb.Sheets[cleanName] = ws
        indexSheet['A' + rowNumber++] = { t: "s", v: cleanName, l: { Target: "#" + cleanName + '!A1' } }
    }
    indexSheet['!ref'] = 'A1:A' + (rowNumber - 1)
    indexSheet['!cols'] = [{ width: 45 }]
    wb.Sheets['Index'] = indexSheet
    XLSX.writeFile(wb, fileName + '.xlsx')
}