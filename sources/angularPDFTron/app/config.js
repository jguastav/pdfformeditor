(function() {
    //"use strict";


    $(document).on('documentLoaded', function() {
		// get the uploaded fileCreatedDate
        PDFNet.initialize().then(function(){
            var doc = readerControl.docViewer.getDocument();
				doc.getPDFDoc().then(function(pdfDoc){
                // Ensure that we have our first page.
                pdfDoc.requirePage(1).then(function()
				{
					var am = readerControl.docViewer.getAnnotationManager();
					am.setCurrentUser(readerControl.currUser);
					am.setIsAdminUser(readerControl.isAdmin);
					am.setReadOnly(readerControl.readOnly);
					

// 					var selectedFile = $('#pdf-upload-button').get(0).files[0];
//					uploadFile(selectedFile);

                    // Run our script
                    runCustomViewerCode(pdfDoc).then(function(){
						PDFNet.runGeneratorWithCleanup(prepareFieldListToCombo(pdfDoc));
                        // Refresh the cache with the newly updated document
                        readerControl.docViewer.refreshAll();
                        // Update viewer with new document
                        readerControl.docViewer.updateView();
                    });
                }
				);
				/*

				*/
            });
        });
    });

	clearPdfForm = function() {
		var annotationManager = readerControl.docViewer.getAnnotationManager();
		console.log(annotationManager);
		
		var annotationList = annotationManager.getAnnotationsList();
		console.log(annotationList);
		annotationManager.hideAnnotations(annotationList);
		
	}

	var uploadFile = function(file) {
		var formData = new FormData();
		formData.append('file', file);

		$.ajax({
			url : '../../../uploadPDF.php',
			type : 'POST',
			data : formData,
			processData: false,  // tell jQuery not to process the data
			contentType: false,  // tell jQuery not to set contentType
			success : function(data) {
			// console.log(data);
			// alert(data);
		}
		});
	}


	/*
	var importAnnotations = function() {
        var annotManager = readerControl.docViewer.getAnnotationManager();

        $.ajax({
            url: '../../samples/hide-annotations/annots.xfdf',
            success: function(data) {
                annotManager.importAnnotations(data);
            },
            dataType: 'xml'
        });		
		
		
	}
*/

    var runCustomViewerCode = function(doc)
    {
        function* main()
        {
            //alert("Hello WebViewer!");
        }
        return PDFNet.runGeneratorWithCleanup(main());
    }


		loadPdfDocument = function(domElement) {
			var files = domElement.files;
      if (files.length === 0) {
        return;
      }
      readerControl.loadLocalFile(files[0], {
          filename: readerControl.parseFileName(domElement.value)
      });
		}

	/*
		function to save current annotations and fild values from view to disk
	*/
		savePdfFormValuesAsXFDF = function() {
	    var xfdfString = readerControl.docViewer.getAnnotationManager().exportAnnotations();
	    var uriContent = "data:text/xml," + encodeURIComponent(xfdfString);
			return xfdfString;

		}







	flattenPDF = function() {
		var pdfDocPromise = readerControl.docViewer.getDocument().getPDFDoc();
		pdfDocPromise.then(function(pdfDoc) {
			pdfDoc.flattenAnnotations(true).then(function() {
                // Refresh the cache with the newly updated document
                readerControl.docViewer.refreshAll();
                // Update viewer with new document
                readerControl.docViewer.updateView();
			});
		})
	}

/* this is the original xfdf - not the values entered by user in html5
*/
	generateXFDF = function() {
        var pdfDocPromise = readerControl.docViewer.getDocument().getPDFDoc();
		pdfDocPromise.then(function(pdfDoc) {
			// console.log(pdfDoc);
			pdfDoc.fdfExtract().then(function (fdfDoc) {
				// console.log(fdfDoc);
				fdfDoc.saveAsXFDFAsString().then(function (xfdfString) {
					window.prompt("Copy to clipboard XFDF: Ctrl+C, Enter", xfdfString);
          console.log(xfdfString);
					return xfdfString;
				}
				) ;
			}) ;
		});
	}

	generateXFDFAnnotations = function() {

		//var manager = new CoreControls.AnnotationManager(docViewer);
		var listOfAnnotations = readerControl.docViewer.getAnnotationManager().getAnnotationsList()
		var xfdfStringAnnotations = readerControl.docViewer.getAnnotationManager().exportAnnotations();
		//var uriContent = "data:text/xml," + encodeURIComponent(xfdfString);

		window.prompt("Copy to clipboard filled XFDF: Ctrl+C, Enter", xfdfStringAnnotations);

	}

	saveAnnotations = function() {
		//var manager = new CoreControls.AnnotationManager(docViewer);
		readerControl.saveAnnotations();


		 //saveAnnotations: function()

	}


	fillFieldFormValue = function(fieldName,value) {
		console.log("Field previous value:");
		console.log(fieldName);
		console.log(value);
		var pdfDocPromise = readerControl.docViewer.getDocument().getPDFDoc();
		pdfDocPromise.then(function(pdfDoc) {
				pdfDoc.getField(fieldName).then(function(theFieldIterator){
					theFieldIterator.getType().then(function(type) {
						console.log("theField.type Ready");
						// field type should be "3"
						console.log("field type");
						console.log(type);
					}); // end theField.getType().then
					theFieldIterator.getValueAsString().then(function(fieldValueString) {
						console.log("Field Prev Value:"+fieldValueString);
						theFieldIterator.setValueAsString(value).then(function(collectionView) {
							console.log("theField.set Ready");
							console.log("Field:"+fieldName+" - new Value");
							console.log(collectionView);
						// theField.commit(null,value,null);
							// change the HTML Form value
							$("div[id='"+fieldName+"'] input").val(value);
							pdfDoc.refreshFieldAppearances();
						readerControl.docViewer.updateVisiblePages();
						readerControl.docViewer.updateView();
						readerControl.docViewer.refreshAll();
						readerControl.docViewer.getDocument().refreshTextData();




						}) ;








					}); // end theField.getValueAsString().then


					}); // end pdfDoc.getField(fieldName).then


		}); // end pdfDocPromise.then
	}

	mergeXFDF2 = function(xfdfString) {


	}


	mergeXFDF = function(xfdfString) {


	var pdfDocPromise = readerControl.docViewer.getDocument().getPDFDoc();

		PDFNet.FDFDoc.createFromXFDF(xfdfString).then(function(fdfDoc){






		/*
			console.log(fdfDoc);
									// test if fdf is correct
			fdfDoc.saveAsXFDFAsString().then(function(xfdfString2){
				console.log("xfdfString2");
				console.log(xfdfString2);
			});
			*/





			pdfDocPromise.then(function(pdfDoc) {

				pdfDoc.initSecurityHandler();
				pdfDoc.lock();



				var changedPages=0;
				var totalAnnots=0;
				pdfDoc.getPageCount().then(function(pageCount){
					// console.log(pageCount);
					for (var i=0;i<pageCount;i++) {
						pdfDoc.getPage(i+1).then(function(currentPage){
							changedPages++;
							currentPage.getNumAnnots().then(function(annotationsCount){
								totalAnnots+=annotationsCount;
								// console.log("annotations count");
								// console.log(annotationsCount);
								for (var j=0;j<annotationsCount;j++) {
									currentPage.getAnnot(j).then(function(annot_obj){
										annot_obj.getType().then(function(annotType){
											totalAnnots--;

											// console.log(annotType);
											switch	(annotType)	{

												/*
												case PDFNet.Annot.Type.e_Widget: {
													//19
													console.log("e_Widget");
													break
												}
												*/

												case PDFNet.Annot.Type.e_Link: {
													//console.log("e_Link");
													break

												}

												case PDFNet.Annot.Type.e_Sound: {
													// console.log("e_Sound");
													break

												}
												case PDFNet.Annot.Type.e_Movie:{
													// console.log("e_Movie");
													break

												}
												case PDFNet.Annot.Type.e_FileAttachment:{
													// console.log("e_FileAttachment");
														// these are not supported for import from webviewer
													break;
												}

												default: {
													currentPage.annotRemoveByIndex(j);
													/*
													console.log("removeIndex");
													console.log(currentPage);
													console.log(j);
													console.log(annot_obj);
													console.log(annotType);
													*/
												}
											}



											if (totalAnnots<=0) {
												// console.log("totalAnnots");
												// console.log(totalAnnots);
												pdfDoc.fdfMerge(fdfDoc).then(function() {
													// console.log("pdfDoc merged");
													// Refresh the cache with the newly uted document


													// pdfDoc.flattenAnnotations(true);


													pdfDoc.unlock();


													// readerControl.saveAnnotations();

													pdfDoc.refreshFieldAppearances();
													readerControl.docViewer.refreshAll();
													// Update viewer with new document
													readerControl.docViewer.updateView();
													// console.log("supuestamente refrescado3");
													if (changedPages==pageCount) {
														console.log("end pages");

													}
													})  // end pdfDoc.fdfMerge(fdfDoc).then
											} // end if
										});  // end annot_obj.getType().then
									});  // currentPage.getannot
								} // for
								console.log(changedPages);
							}) // end currentPage.getNumAnnots().then
						})  // end pdfDoc.getPage(i+1).then
					}  // for
				})  // end pdfDoc.getPageCount().then


				}); // end pdfDocPromise.then
			});  // end PDFNet.FDFDoc.createFromXFDF(xfdfString).then
	}  // end function(xfdfString)


	getFields = function() {
		return comboFieldList;
	}

	flattenPDFFile = function() {
//		result= PDFNet.runGeneratorWithCleanup(flattenPDFFileGenerator());
		result= PDFNet.runGeneratorWithCleanup(simpleFlattenPDFFFileGenerator());
		return result;
	}

  var removeHtmlFormFields = function() {
      var myNode = document.getElementById("pageWidgetContainer0");
      console.log(myNode);
      if (myNode!=null) {
        while (myNode.firstChild) {
            console.log("field");
            myNode.removeChild(myNode.firstChild);
        }
      }
  }

// javascript function that uploads a blob to upload.php
var uploadPDFBlob = function(pdfBlob) {
    //var blob = yourAudioBlobCapturedFromWebAudioAPI;// for example   
    var reader = new FileReader();
    // this function is triggered once a call to readAsDataURL returns
    reader.onload = function(event){
        var fd = new FormData();
			fd.append('baseName', 'flattenedPdf');
			fd.append('content', event.target.result);
		$.ajax({
			type: 'POST',
			url: '../../../php/saveFlattenedPDF.php',
			data: fd,
			processData: false,
			contentType: false
		}).done(function(data) {
            // print the output from the upload.php script
			console.log(data);
		});
    };      
    // trigger the read from the reader...
    reader.readAsDataURL(pdfBlob);

}

  
var simpleFlattenPDFFFileGenerator = function* () {
		var pdfDoc= yield readerControl.docViewer.getDocument().getPDFDoc();
    var fdfDoc = yield pdfDoc.fdfExtract(0);  // PDFNet.PDFDocExtractFlag.e_forms_only);  //0
    var am = readerControl.docViewer.getAnnotationManager();
    var xfdfString = am.exportAnnotations();
    // fdfDoc.mergeAnnots(xfdfString);
    var fdfDoc= yield PDFNet.FDFDoc.createFromXFDF(xfdfString);
    yield pdfDoc.fdfMerge(fdfDoc);
		yield pdfDoc.flattenAnnotations(true);
		// PDFTron.WebViewer.Options.enableAnnotations=false;
	// readerControl.docViewer.enableAnnotations=false;
  //  var annotationsList = an.getAnnotationsList();
    //am.hideAnnotations(annotationsList);
	// PDFNet.PDFViewCtrl.enableInteractiveForms(false);
    // removeHtmlFormFields();
	var bufferMemoryFlattened = yield pdfDoc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
	console.log(bufferMemoryFlattened.length);
	// upload document
	var pdfBlob = new Blob([bufferMemoryFlattened], {
        type: 'application/pdf'
    });
	console.log(pdfBlob.size);
	uploadPDFBlob(pdfBlob);
    // Refresh the cache with the newly updated document
    readerControl.docViewer.refreshAll();
    // Update viewer with new document
    readerControl.docViewer.updateView();

}


	var flattenPDFFileGenerator = function* () {

		var pdfDoc= yield readerControl.docViewer.getDocument().getPDFDoc();
		// 4 ways to copy pdfDoc if don't want to change pdfDoc in viewer

		// pdfDoc.createShallowCopy or
		// it seems that doesnot copy all

		// pdfDoc.getSDFDoc
		// not corresponding in documentation


		// saveStream
		// PDFNet.PDFDoc.createFromFilter(stream)

		// saveMemoryBuffer
		// PDFNet.PDFDoc.createFromBuffer(buf)


		// unlock: SDFDoc.removeSecurity();
		var pdfDocCopied = yield pdfDoc.createShallowCopy();
		// flatten only field values
		yield pdfDocCopied.flattenAnnotations(true);
		// save the document

/*
SDFDoc.SaveOptions
 	Member name	Value	Description
e_compatibility	32	Save the document in a manner that maximizes compatibility with older PDF consumers (e.g. the file will not use object and compressed xref streams).
e_linearized	16	Save the document in linearized (fast web-view) format. Requires full save.
e_omit_xref	8	do not save cross-reference table
e_hex_strings	4	save all string in hexadecimal format.
e_remove_unused	2	remove unused objects (requires full save)
e_incremental	1	save document in incremental mode.
*/



		var docbuf = yield pdfDocCopied.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);

		/*
		// pdfDocCopied.saveStream(flattenedStream,)
		// convert stream to string
		StreamReader reader = new StreamReader(flattenedStream);
		string text = reader.ReadToEnd();
		*/

		// it should not change anything because the change was made on the copied one
        // Refresh the cache with the newly updated document
        readerControl.docViewer.refreshAll();
        // Update viewer with new document
        readerControl.docViewer.updateView();
		return docbuf;
	}



	prepareFieldListToCombo = function* (pdfDoc) {
			/*
			yield PDFNet.initialize();
			var doc = readerControl.docViewer.getDocument();
			var pdfDoc = doc.getPDFDoc();
			*/
			comboFieldList=[];
			var itr = yield pdfDoc.getFieldIteratorBegin();
			for(; (yield itr.hasNext()); itr.next()){
				var currentItr = yield itr.current();
				comboFieldList.push(yield currentItr.getName());
			}
			//console.log(comboFieldList);
	}




})();
//# sourceURL=config.js
