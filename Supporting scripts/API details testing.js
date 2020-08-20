
res1.map(a => {
    setTimeout(() => {
      let tmp = { input: {}, output: {} }, fullApiName = a.MINM + '/' + a.TRNM
      console.log('calling for ' + fullApiName)
      Promise.all([
        callM3API('MRS001MI/LstFields', { MINM: a.MINM, TRNM: a.TRNM, TRTP: 'I' }),
        callM3API('MRS001MI/LstFields', { MINM: a.MINM, TRNM: a.TRNM, TRTP: 'O' })
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
    }, 500)

  })