# pdfformeditor
online pdf form editor using angular and pdftron


#files
indexPdfForms.html
	html sample that incorporates online pdf editor simulating xteros application.
	PDF FORM EDITOR components: 
		ng-app="pdfFormFillerApp"
		<script .... includes>
		<pdfform />   -- tag that includes the editor



appPdfForms.js   <main app>
	app = pdfFormFillerApp
	uses module: pdfFormLibModule
	


pdfFormLibModule.js
	Module: pdfFormLibModule


components/pdfFormLib  <folder>
	pdfFormLibDirective.js: 	  angular directives definitions
								pdfform - the pdf online editor
								script - special behavior to load scripts included in angular templates
										reloads those scripts marked as "text/javascript-lazy"
	pdfFormLibController.js : angular controllers
								Methods related to use cases
								To interact with PDFTron library call to functions declared in config.js
								
							
	pdfFormLibTemplate.html	: angular template that contains the pdf online editor
								initializes PDFTron WebViewer running js/pdftron.config.js

	
php <folder>
		server side behavior



WebViewer <folder>
		PDFTron javascript libraries (2 two : WebViewer and PDFNetJs)
			WebViewer: PDFTron online viewer
			PDFNetJS: PDFTron Javascript pdf manipulation library

			
#PDFTron behavior

PDFTron is configured by the following files
config.js:
		this file contains all direct interaction with PDFTron library and web viewer
js/pdftron.config.js:
		Initialization file for PDFTron WebViewer
			
			
			
			
			
Xteros_files
fonts
assets
app
		Folders to simulate the main xteros application
		

			
#Structure:
developed PDF Editor form is a selected implementation of PDFTron.
There are many more alternatives.

This approach was constructed using PDFTron Javascript library.
(This can be changed for server options on selected operations)

<pdftron /> includes what is defined in pdfFormLibDirective.js
That tag includes the template "pdfFormLibTemplate.html"
the template have included a div
        <div id="pdfViewer"></div>
In that div PDFTron library builds an iframe that is the online PDF Editor and contains the PDFNetjs library

			
			
			
			
			
			
Using the sample
================
	
Main urls
http://www.sakpanels.org/xteros/angularPDFTron/app/indexPdfForms.html
http://www.sakpanels.org/xteros/angularPDFTron/app/php/listPDFFiles.php



By now I reached the main 3 functionalities that uses and integrates angular / frontend and PDFTron. and all have impact in backend
- Open PDF Document (Changed)
- Save XFDF data
- Sign PDF

		
The server uploaded files can be viewed on 		
		http://www.sakpanels.org/xteros/angularPDFTron/app/php/indexPdfForms.html	
#Usage: 

1.- Enter to : http://www.sakpanels.org/xteros/angularPDFTron/app/php/listPDFFiles.php
2.- Open a pdf form using cloud-upload icon
		Automatically Saves lastUploaded.pdf on server
3.- Fill the form 
4.- Press the save Button
		Saves uploadSampleXfdf<YYYYmmddhhss>.xfdf
5.- Press sign
		The viewed pdf is flattened (issue: remains the html5 fields)
		Saves flattened pdf on flattenedPdf<YYYYmmddhhss>.pdf
		

To save the files I call php from 	
	- app\components\pdfFormLib\pdfFormLibController.js 
	- app\config.js   (PDFTron controller)
	
	but this can be changed as needed. 

The main files in source code are
pdfFormLibModule.js
config.js
components/pdfFormLib/*.*
php/*.*
Specially pdfFormLibController.js where by now is the call to server side


I'm using the PDFTron Javascript library, resolving in the frontend and making calls to server when it's needed to call the rules engine or save something. 
This approach can be changed.
			
      
#References 
urls to download libraries


PDFNet Server side libraries
http://www.pdftron.com/pdfnet/downloads.html

Java and C++ Version for linux
http://www.pdftron.com/downloads/PDFNetC64.tar.gz

Client javascript libraries

http://www.pdftron.com/webviewer/download.html
and 
https://www.pdftron.com/pdfnet/pdfnetjs/    
(PDFNet.js full)


Javascript framework versions
jquery-1.7.2
AngularJS v1.5.11

PHP.: public host: 4.4.9 or 5.6.16  (preferred)
         php files are only samples about how to communicate with server side components
Python 2.7
		http://www.pdftron.com/downloads/PDFNetWrappers/PDFNetWrappersLinux64.tar.gz
ubuntu server 16.04
http server nginx

