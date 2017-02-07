//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2014 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2014 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

(function (exports) {
    "use strict";

exports.runElementReaderTest = function()
{
    function* ProcessElements(reader) {
        for (var element = yield reader.next(); element !== null; element = yield reader.next()) // Read page contents
        {
            var temp = yield element.getType();
            switch (temp) 
            {
                
                case exports.PDFNet.Element.Type.e_path: // Process path data...
                    {
                        var data = yield element.getPathData();
                        var operators = data.operators;
                        var points = data.points;
                    }
                    break;
                case exports.PDFNet.Element.Type.e_text: // Process text strings...
                    {
                        var data = yield element.getTextString();
                        console.log(data);
                    }
                    break;
                case exports.PDFNet.Element.Type.e_form: // Process form XObjects
                    {
                        reader.formBegin();
                        yield * ProcessElements(reader);
                        reader.end();
                    }
                    break;
                default:                
            }
        }
    }

    function* main() {
        console.log("Beginning Test");
        var ret = 0;

        // Relative path to the folder containing test files.
        var input_url = "../TestFiles/";

        var doc = yield exports.PDFNet.PDFDoc.createFromURL(input_url + "newsletter.pdf");// yield if there is ret that we care about.
        doc.initSecurityHandler();
        doc.lock();
        console.log("PDFNet and PDF document initialized and locked");

        var pgnum = yield doc.getPageCount();
        var page_reader = yield exports.PDFNet.ElementReader.create();
        var itr = yield doc.getPageIterator(1);

        for (itr; yield itr.hasNext(); itr.next()) //  Read every page
        {
            var curritr = yield itr.current();
            page_reader.beginOnPage(curritr);
            yield * ProcessElements(page_reader); 
            page_reader.end();
        }

        console.log("Done.");
        return ret;
    }

    // start the generator
    PDFNet.runGeneratorWithCleanup(main());
}
})(window);

//# sourceURL=ElementReaderTest.js