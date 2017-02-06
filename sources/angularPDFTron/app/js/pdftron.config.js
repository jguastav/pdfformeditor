var myWebViewerContainer = document.getElementById("pdfViewer");
var myWebViewer = new PDFTron.WebViewer({
	type : 'html5',
	path : 'WebViewer/lib',
	documentType: 'pdf',
	enableAnnotations: true,
	annotationAdmin: true,
	config: "config.js",
    // initialDoc : "files/employeeFilled.pdf",
	pdfnet : true,
	showLocalFilePicker : false,
	hideAnnotationPanel: false ,
	streaming : false
}, myWebViewerContainer);
//document.body.appendChild(myWebViewerContainer);


/*
 $('#pdfViewer').bind('documentLoaded', function(event, data){
	//event triggered
	console.log(data);
	alert("document loaded");
	});
*/


function generateXFDF1() {
	alert("generateXFDF1 - 1234 trae doc instance");
	console.log(myWebViewer);
	console.log(doc);
}


	$("#mergeXFDF2Button").on("click",function() {
		var selectedFile = $('#input-xfdf').get(0).files[0];
		mergeReader2.readAsText(selectedFile);
	});


	$("#generateXFDFButton").on("click",function() {
		$("#pdfViewer iframe")[0].contentWindow.generateXFDF();
	});


	$("#generateXFDFAnnotationsButton").on("click",function() {
		$("#pdfViewer iframe")[0].contentWindow.generateXFDFAnnotations();
	});

	$("#saveAnnotationsButton").on("click",function() {
		$("#pdfViewer iframe")[0].contentWindow.saveAnnotations();
	});


var mergeReader2 = new FileReader();
	mergeReader2.onload = function(event) {
		var xfdfString = event.target.result;
		$("#pdfViewer iframe")[0].contentWindow.mergeXFDF2(xfdfString);
};


var mergeReader = new FileReader();
	mergeReader.onload = function(event) {
		var xfdfString = event.target.result;
		$("#pdfViewer iframe")[0].contentWindow.mergeXFDF(xfdfString);
};


	$("#mergeXFDFButton").on("click",function() {
		var selectedFile = $('#input-xfdf').get(0).files[0];
		mergeReader.readAsText(selectedFile);
	});


	$("#fillFieldFormValueButton").on("click",function() {
		var fieldName=$("#fieldSelection").find(":selected").text();
		var fieldValue=$("#textFieldInput").val();
		// change the model
		$("#pdfViewer iframe")[0].contentWindow.fillFieldFormValue(fieldName,fieldValue);
	});



	$("#flattenPDFButton").on("click",function() {
		$("#pdfViewer iframe")[0].contentWindow.flattenPDF();
	});


	$("#fillComboFields").on("click",function() {
		fieldsArray=$("#pdfViewer iframe")[0].contentWindow.getFields();
		var comboSelect = document.getElementById("fieldSelection");
		while (comboSelect.length>0) {
			comboSelect.remove(0);
		}
		for(x = 0 ; x < fieldsArray.length ; x++){
			newOption = document.createElement("option");
			newOption.text = fieldsArray[x];
			comboSelect.add(newOption);
		}
	});

	$("#deleteXFDFFileButton").on("click",function() {
		$.ajax({
			url: "deleteXFDF.php",
			data: null,
			success: alert("xfdf deleted"),
			dataType: null
		});
	});
