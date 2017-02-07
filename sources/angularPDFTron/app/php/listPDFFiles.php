<html>
<head>
</head>
<body>
<?php


echo ("<p>");
echo ("Current Dir: ".getcwd() . "<br/>\n");
echo ("</p>");


// scan dir for php 4
function scan_dir2($dir) {
	//path to directory to scan
	$directory = $dir;

	//get all text files with a .txt extension.
	$texts = glob($directory . "/*.*");
	$result = array();
	//print each file name
	foreach($texts as $text)
	{
		$result[]=$text;
	}
	return $result;
}


/*
// scandir for php 5
function scan_dir($dir) {
    $ignored = array('.', '..', '.svn', '.htaccess');

    $files = array();
    foreach (scandir($dir) as $file) {
        if (in_array($file, $ignored)) continue;
        $files[$file] = filemtime($dir . '/' . $file);
    }

    arsort($files);
    $files = array_keys($files);

    return ($files) ? $files : false;
}
*/


// $filesToList = scan_dir("uploaded");

if (!file_exists('uploaded')) {
    mkdir('uploaded', 0777, true);
	echo("uploaded directory created\n");
} else {
	echo("uploaded file already exists<br/>");
}



$filesToList = scan_dir2("uploaded");
echo("<table>");
foreach ($filesToList as $thisFile) {
	?>
	<tr><td><a href=<?php
	//echo('"uploaded/'.$thisFile.'"');
	echo('"'.$thisFile.'"');
	?>
	target="_blank" /><?php
	echo($thisFile);
	?></a>
	</td><tr>
	<?php

}
echo("</table>");
 ?>


</body>
</html>
