const proj4List0 = document.getElementById('xyProj4List0');
const proj4List1 = document.getElementById('xyProj4List1');

const xVal = document.getElementById('xVal');
const yVal = document.getElementById('yVal');

const transformProj = document.getElementById('transformProj');
const output = document.getElementById('output');

/*
proj4(firstProjection,secondProjection).forward([-122.305887, 58.9465872]);
// [-2690575.447893817, 36622916.8071244564]
proj4(secondProjection,firstProjection).inverse([-122.305887, 58.9465872]);
// [-2690575.447893817, 36622916.8071244564]
*/
var crsNotation = 'EPSG:3414';
var crsNotationOutput = 'EPSG:4326';


var sortedProj4List = {};
var crsCodeList=Object.keys(proj4_list);
crsCodeList=crsCodeList.sort();
for(var c in crsCodeList) {
  sortedProj4List[ crsCodeList[c] ] = proj4_list[ crsCodeList[c] ];
}

var arr=[];
for(var p in sortedProj4List) {
  var option = document.createElement("option");
  var oTxt = p;
  var crsCode = oTxt.split(':')[1];
  option.text = crsCode;
  option.value = sortedProj4List[p];
  proj4List0.add(option);

  option = document.createElement("option");
  option.text = crsCode;
  option.value = sortedProj4List[p];
  proj4List1.add(option);

  arr.push([p, sortedProj4List[p]]);
}

proj4List0.value=sortedProj4List[crsNotation];
proj4List1.value=sortedProj4List[crsNotationOutput];
proj4.defs(arr);

var fromProj = proj4.defs(crsNotation);
var toProj = proj4.defs(crsNotationOutput);

proj4List0.addEventListener('change', (e0) => {
  let defStr=e0.target.selectedOptions[0].value;
  let defTxt=e0.target.selectedOptions[0].text;
  
  fromProj=proj4(defStr);
});

proj4List1.addEventListener('change', (e1) => {
  let defStr=e1.target.selectedOptions[0].value;
  let defTxt=e1.target.selectedOptions[0].text;
  
  toProj=proj4(defStr);
});

transformProj.addEventListener('click', () => {
    var x = parseFloat(xVal.value); // lng,lat
    var y = parseFloat(yVal.value);
    
    var lngLatArr=proj4(fromProj, toProj, [x, y]); // lng,lat
    output.innerHTML = '<p><strong>Longitude (X):</strong> '+lngLatArr[0]+'</p><p><strong>Latitude (Y):</strong> '+lngLatArr[1]+'</p>';
});

var outputJSONObj=[];

const uploadCSVFileBtn = document.getElementById('uploadCSVFileBtn');
const uploadCSVFile = document.getElementById('uploadCSVFile');
const saveTransformedProj = document.getElementById('saveTransformedProj');
const outputPreviewTable = document.getElementById('outputPreviewTable');

const xFieldName = document.getElementById('xFieldName');
const yFieldName = document.getElementById('yFieldName');

function sanitiseObj(obj) {
  let tempObj={};
  let objKeys=Object.keys(obj);
  for(let o in objKeys) {
    let keyVal=objKeys[o]+'';
    let objVal=obj[keyVal]+'';
    keyVal=keyVal.trim();
    objVal=objVal.trim();
    tempObj[keyVal]=objVal;
  }
  return tempObj;
}

uploadCSVFileBtn.addEventListener('click', ()=> {
    uploadCSVFile.click();
});
uploadCSVFile.addEventListener('click', ()=> {
    uploadCSVFile.value='';
});
uploadCSVFile.addEventListener('change', (e)=> {
    saveTransformedProj.disabled=true;

    if (!window.FileReader) {
        alert('Your browser does not support HTML5 "FileReader" function required to open a file.');
    } else {
        var fileis = uploadCSVFile.files[0];
        var fileredr = new FileReader();
        fileredr.onload = function (fle) {
            var csvStr = fle.target.result;

            converter.csv2jsonAsync(csvStr).then((jsonDataOutput) => {
                for(var r in jsonDataOutput) {
                    var dataRecord=jsonDataOutput[r];
                    dataRecord=sanitiseObj(dataRecord);

                    var x=parseFloat(dataRecord[xFieldName.value]);
                    var y=parseFloat(dataRecord[yFieldName.value]);

                    var lngLatArr;
                    try {
                      lngLatArr=proj4(fromProj, toProj, [x, y]);
                    } catch(err) {
                      if(err=='TypeError: coordinates must be finite numbers') {
                        alert('⚠️ '+ err + '\n\n' + '𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘀𝘂𝗿𝗲 𝘁𝗵𝗮𝘁 𝗫 & 𝗬 𝗳𝗶𝗲𝗹𝗱𝗻𝗮𝗺𝗲𝘀 𝗮𝗿𝗲 𝗶𝗻𝗽𝘂𝘁 𝗰𝗼𝗿𝗿𝗲𝗰𝘁𝗹𝘆.');
                      }
                    }
                    var lat=lngLatArr[1];
                    var lng=lngLatArr[0];

                    var newDataRecord={
                        ...dataRecord,
                        'LATITUDE':lat,
                        'LONGITUDE':lng
                    };
                    outputJSONObj.push(newDataRecord);
                }
                // console.log(outputJSONObj);

                var samplePreviewOutputJSONObj=JSON.parse(JSON.stringify(outputJSONObj));
                samplePreviewOutputJSONObj.splice(10);

                var headerArr = Object.keys(samplePreviewOutputJSONObj[0]);
                var outputPreviewTableHtmlStr='<p><u>Sample Preview of Output</u></p>';
                outputPreviewTableHtmlStr+= '<table class="table table-bordered">';
                outputPreviewTableHtmlStr+= ('<thead><tr><th>'+headerArr.join('</th><th>')+'</th></tr></thead>');
                outputPreviewTableHtmlStr+= '<tbody>';
                for(var o in samplePreviewOutputJSONObj) {
                    if(!isNaN(o)) {
                      var recordEntry=Object.values( samplePreviewOutputJSONObj[o] );
                      outputPreviewTableHtmlStr+= ('<tr><td>'+recordEntry.join('</td><td>')+'</td></tr>');
                    }
                }
                outputPreviewTableHtmlStr+= '</tbody>';
                outputPreviewTableHtmlStr+= '<table>';

                outputPreviewTable.innerHTML=outputPreviewTableHtmlStr;

                saveTransformedProj.disabled=false;
                saveTransformedProj.addEventListener('click', () => {
                    converter.json2csvAsync(outputJSONObj, {
                        prependHeader: true,
                        sortHeader: true,
                        trimFieldValues: true,
                        trimHeaderFields: true,
                        emptyFieldValue: '',
                        delimiter: {
                            field: ',',
                            wrap: '\"',
                            eol: '\n'
                        }
                    }).then((csvDataOutput) => {
                        if (!window.Blob) {
                            alert('Your browser does not support HTML5 "Blob" function required to save a file.');
                        } else {
                            var txtwrt = csvDataOutput;
                            var textblob = new Blob([txtwrt], {type: 'text/plain'});
                            var saveas = 'output(with_lat_lng).csv';
                            var dwnlnk = document.createElement('a');
                            dwnlnk.download = saveas;
                            dwnlnk.innerHTML = 'Download File';
                            if (window.webkitURL != null) {
                                dwnlnk.href = window.webkitURL.createObjectURL(textblob);
                            } else {
                                dwnlnk.href = window.URL.createObjectURL(textblob);
                                dwnlnk.style.display = 'none';
                                document.body.appendChild(dwnlnk);
                            }
                            dwnlnk.click();
                        }
                    });
                });
            });
        };
        fileredr.readAsText(fileis);
    }
});