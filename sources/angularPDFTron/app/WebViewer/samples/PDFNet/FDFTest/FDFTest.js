//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2015 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

(function(exports){
    "use strict";



    var createFDFFromXFDFURL = function(url) {
        return new Promise(function(resolve, reject) {
            var xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function() {
              if (this.readyState === this.DONE) {
                if(xhttp.status == 200) {
                    var data = xhttp.responseText;
                    PDFNet.FDFDoc.createFromXFDF(data).then(function(fdfdoc){
                        resolve(fdfdoc);
                    },function(e) {
                        reject(e);
                    });
                }
                else {
                    reject("Request for URL " + url + " received incorrect HTTP response code " + xhttp.status);
                }
              }
            };
            xhttp.open("GET", url, true);
            xhttp.send();
        });
    };


exports.runFDFTest = function()
{
    function* main()
    {
        console.log("Beginning FDF Test.");
        var input_url =  "../TestFiles/";

        // Import XFDF into FDF, then merge data from FDF into PDF
        try{
            // Annotations
            console.log("Import annotations from XFDF to FDF.");
            var fdf_doc = yield createFDFFromXFDFURL(input_url + "form1_annots.xfdf");


            var doc = yield PDFNet.PDFDoc.createFromURL(input_url + "form1.pdf");
            doc.initSecurityHandler();

            console.log("Remove annotatations to avoid duplicates");

            var pitr = yield doc.getPageIterator();
            for (; (yield pitr.hasNext()); pitr.next())
            {
                try{
                    var page = yield pitr.current();
                    for (var i = (yield page.getNumAnnots()); i>0;)
                    {

                        var annot_obj = yield page.getAnnot(--i);
                        switch (yield annot_obj.getType())
                        {
                        case PDFNet.Annot.Type.e_Widget:
                        case PDFNet.Annot.Type.e_Link:
                        case PDFNet.Annot.Type.e_Sound:
                        case PDFNet.Annot.Type.e_Movie:
                        case PDFNet.Annot.Type.e_FileAttachment:
                            // these are not supported for import from webviewer
                            break;
                        default:
                            page.annotRemoveByIndex(i);
                        break;
                        }
                    }
                }
                catch (e)
                {
                    console.log("Error Removing Annotations: " + e);
                    (yield page.getSDFObj()).erase("Annots");
                }
            }

            console.log("Merge annotations from FDF.");

            doc.fdfMerge(fdf_doc);
            var docbuf = yield doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
            saveBufferAsPDFDoc(docbuf, "form1_with_annots.pdf");
            console.log("Done sample");
        } catch (err){
            console.log(err);
        }
    }
    // start the generator
    PDFNet.runGeneratorWithCleanup(main());
}
})(window);
//# sourceURL=FDFTest.js