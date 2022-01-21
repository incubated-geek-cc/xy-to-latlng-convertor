var proj4List0 = document.getElementById('xyProj4List0');
var crsNotation = 'EPSG:3414';
proj4.defs(crsNotation, proj4_list[crsNotation]);

var fromProj = proj4.defs(crsNotation);
var toProf = proj4.defs('EPSG:4326');

var xVal = document.getElementById('xVal');
var yVal = document.getElementById('yVal');

var transformProj = document.getElementById('transformProj');
var output = document.getElementById('output');

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

  arr.push([p, sortedProj4List[p]]);
}
proj4List0.value=sortedProj4List[crsNotation];

proj4.defs(arr);

proj4List0.addEventListener('change', (e) => {
  var defStr=e.currentTarget.selectedOptions[0].value;
  var defTxt=e.currentTarget.selectedOptions[0].text;
  
  fromProj=proj4(defStr);
});

transformProj.addEventListener('click', () => {
    var x = parseFloat(xVal.value);
    var y = parseFloat(yVal.value);

    var latLngArr=proj4(fromProj, toProf, [x, y]);
    output.innerHTML = '<p><strong>Latitude:</strong> '+latLngArr[1]+'</p><p><strong>Longitude:</strong> '+latLngArr[0]+'</p>';
});

var outputJSONObj=[];

var uploadCSVFileBtn = document.getElementById('uploadCSVFileBtn');
var uploadCSVFile = document.getElementById('uploadCSVFile');
var saveTransformedProj = document.getElementById('saveTransformedProj');
var outputPreviewTable = document.getElementById('outputPreviewTable');

var xFieldName = document.getElementById('xFieldName');
var yFieldName = document.getElementById('yFieldName');

function sanitiseObj(obj) {
  var tempObj={};
  var objKeys=Object.keys(obj);
  for(var o in objKeys) {
    var keyVal=objKeys[o]+'';
    var objVal=obj[keyVal]+'';
    keyVal=keyVal.trim();
    objVal=objVal.trim();
    tempObj[keyVal]=objVal;
  }
  return tempObj;
}

uploadCSVFileBtn.addEventListener('click', ()=> {
    uploadCSVFile.click();
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
                console.log(jsonDataOutput);
                for(var r in jsonDataOutput) {
                    var dataRecord=jsonDataOutput[r];
                    dataRecord=sanitiseObj(dataRecord);

                    var x=parseFloat(dataRecord[yFieldName.value]);
                    var y=parseFloat(dataRecord[xFieldName.value]);
                    var latLngArr=proj4(fromProj, toProf, [x, y]);
                    var lat=latLngArr[1];
                    var lng=latLngArr[0];

                    var newDataRecord={
                        ...dataRecord,
                        'LATITUDE':lat,
                        'LONGITUDE':lng
                    };

                    outputJSONObj.push(newDataRecord);
                }
                console.log(outputJSONObj);

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