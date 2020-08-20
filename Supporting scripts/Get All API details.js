
let io = {}, fi = {}, fiNameMapping = {}, calledAPIs = []
var getAllApiDetails = () => {
  callM3API('MRS001MI/LstPrograms', {}).then(
    async (res1) => {
      console.log('Found total apis: ', res1.length)
      await res1.map(async (progName) => {
        let trimmedPrgName = progName.MINM.trim()
        await callM3API('MRS001MI/LstTransactions', { MINM: trimmedPrgName, INCG: 1 }).then(
          async (transactionsList) => {
            await transactionsList.map(async (t) => {
              let trimmedtransName = t.TRNM.trim()
              let tmp = { input: {}, output: {} }, fullApiName = trimmedPrgName + '/' + trimmedtransName
              console.log('calling for ' + fullApiName)
              if (!calledAPIs.includes(fullApiName)) {
                calledAPIs.push(fullApiName)
                await Promise.all([
                  callM3API('MRS001MI/LstFields', { MINM: trimmedPrgName, TRNM: trimmedtransName, TRTP: 'I' }),
                  callM3API('MRS001MI/LstFields', { MINM: trimmedPrgName, TRNM: trimmedtransName, TRTP: 'O' })
                ]).then(fieldInfo => {
                  fieldInfo[0].map(f => {
                    tmp.input[f.FLNM] = {
                      description: f.FLDS,
                      length: f.LENG,
                      mandatory: f.MAND,
                      type: f.TYPE
                    }
                    fiNameMapping[f.FLDS] = f.FLNM
                    if (fi[f.FLNM] == undefined) {
                      fi[f.FLNM] = {
                        description: f.FLDS,
                        length: f.LENG,
                        mandatory: f.MAND,
                        type: f.TYPE,
                        inputAPIs: [fullApiName],
                        outputAPIs: []
                      }
                    } else {
                      fi[f.FLNM].inputAPIs.push(fullApiName)
                    }
                  })
                  fieldInfo[1].map(f => {
                    tmp.output[f.FLNM] = {
                      description: f.FLDS,
                      length: f.LENG,
                      mandatory: f.MAND
                    }
                    fiNameMapping[f.FLDS] = f.FLNM
                    if (fi[f.FLNM] == undefined) {
                      fi[f.FLNM] = {
                        description: f.FLDS,
                        length: f.LENG,
                        mandatory: f.MAND,
                        type: f.TYPE,
                        inputAPIs: [],
                        outputAPIs: [fullApiName]
                      }
                    } else {
                      fi[f.FLNM].outputAPIs.push(fullApiName)
                    }
                  })
                  io[fullApiName] = tmp
                }).catch(e => {
                  console.log('No data for' + fullApiName)
                })
              }
            })
          }
        )
      })
    }
  )
}

var callM3API = (api, query = {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let queryString = '?'
      try {
        Object.keys(query).map(k => queryString += (k + '=' + query[k] + '&'))
        $.ajax({
          type: "GET",
          url: "/m3api-rest/execute/" + api + ';metadata=true;maxrecs=0;excludempty=false' + queryString,
          dataType: "json",
          success: function (response) {
            if (response['MIRecord'] != undefined) {
              let returnValue = []
              response['MIRecord'].map(MiRec => {
                let row = {}
                MiRec.NameValue.map(k => row[k.Name] = k.Value.trim())
                returnValue.push(row)
              })
              resolve(returnValue)
            } else {
              reject(response.Message)
            }
          }
        })
      } catch (error) {
        reject('Error calling ' + api + queryString + ' API')
      }
    }, 500)

  })
}

var download = (content, fileName, contentType) => {
  var a = document.createElement("a")
  var file = new Blob([JSON.stringify(content)], { type: contentType })
  a.href = URL.createObjectURL(file)
  a.download = fileName
  a.click()
}
// download(jsonData, 'json.txt', 'text/plain');