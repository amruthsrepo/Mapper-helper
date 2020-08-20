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
        $('#functionsList').html('');
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
                            Name: name,
                            desc: desc,
                            iid: IID
                        })
                    } else {
                        dataObjects.Params[fid].out.push({
                            Name: name,
                            desc: desc,
                            iid: IID
                        })
                    }
                } else if (dataObjects.Links.any.includes(IID)) {
                    if (type) {
                        dataObjects.Params[fid].in.push({
                            Name: name,
                            desc: desc,
                            iid: IID
                        })
                    } else {
                        dataObjects.Params[fid].out.push({
                            Name: name,
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
                $('#functionsList').append(getInfoTable(fName, dataObjects.Params[fID]))
            })
            dataObjects.functionListNodes = allFuncList
        }
        fr.readAsText(selectedFile)
    } else {
        alert('Please select a .map file')
    }
}

var getInfoTable = (name, ioFields) => {
    let mainList = document.createElement('li')
    let inputList = document.createElement('ul')
    let outputList = document.createElement('ul')
    $(mainList).append('<h5>' + name + '</h5>')
    $(mainList).append('InputFields')
    $(mainList).append(inputList)
    $(mainList).append('OutputFields')
    $(mainList).append(outputList)
    try {
        ioFields.in.map(i => $(inputList).append('<li>' + i.Name + ': ' + i.desc + '</li>'))
    } catch (e) {
        console.log('No Input Fields for: ' + name)
    }
    try {
        ioFields.out.map(i => $(outputList).append('<li>' + i.Name + ': ' + i.desc + '</li>'))
    } catch (e) {
        console.log('No Input Fields for: ' + name)
    }
    return mainList
}