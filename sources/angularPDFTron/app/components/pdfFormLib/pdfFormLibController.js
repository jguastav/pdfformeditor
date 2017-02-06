'use strict';

pdfFormLibModule.controller("pdfFormLibModule.PdfToolbarController",["$scope","$rootScope","$http",function($scope,$rootScope,$http) {

  var getPDFViewerContext= function() {
    return document.getElementById("pdfViewer").children[0].contentWindow;
  }


	var uploadFile = function(file) {
		var formData = new FormData();
		formData.append('file', file);

		$.ajax({
			url : 'php/uploadPDF.php',
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
  
  
  
  $scope.openPdfDocument = function(inputFileElement) {
	getPDFViewerContext().loadPdfDocument(inputFileElement);
	var selectedFile = inputFileElement.files[0];
	uploadFile(selectedFile);
  }

  $scope.clearPdfForm = function() {
    // Actions.ResetForm
    alert("clearPdfForm");
  }

  $scope.signPdfDocument = function() {
    // flatten pdf file
	//$rootScope.PDFTron.WebViewer.Options.enableAnnotations=false;
    getPDFViewerContext().flattenPDFFile();

    // save file to disk

/*
    console.log(bufferMemoryFlattened);

    var blob = new Blob([bufferMemoryFlattened], {
        type: 'application/pdf'
    });
    debugger;
    console.log(blob);
*/
//  $rootScope.FileSaver.saveAs(blob, 'abc.pdf');


/*
    var oReq = new XMLHttpRequest();
    oReq.open("POST", "php/uploadFlattenPdf.php", true);
    oReq.onload = function (oEvent) {
      // Uploaded.
    };



    oReq.send(blob);
*/






/*
    var data = $.param({
        baseName:"uploadFlattenedPDF",
        content:blob
    }
    );

    var config = {
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
    }

    $http.post("php/saveFlattenedPdf.php",data,config);
*/


  }
  $scope.downloadPdfDocument = function() {
    alert("by now generating xfdf in console");
    getPDFViewerContext().generateXFDF();
    alert("downloadPdfDocument");
  }
  $scope.uploadPdfDocument = function() {
  }
  $scope.savePdfForm = function() {
      var xfdfResult = getPDFViewerContext().savePdfFormValuesAsXFDF();
      var data = $.param({
          baseName:"uploadSampleXfdf",
          content:xfdfResult
      }
      );

      var config = {
          headers : {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
          }
      }

      $http.post("php/savePdfXfdf.php",data,config);

  }
  
  
  $scope.printPdfDocument = function() {
    // startPrintJob
    // endPrintJob in WebViewer
    alert("printPdfDocument");
  }
  
  
  $scope.closePdfDocument = function() {
    /*
    PDFReaderControl
    closeDocument: function() {
    exports.DesktopReaderControl.prototype.closeDocument.call(this);
    this.$progressBar.removeClass('document-failed');
    this.$progressBar.hide();
}
    */

    alert("closePdfDocument");
  }
}]);
