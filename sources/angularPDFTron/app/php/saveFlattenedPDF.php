<?php
echo (getcwd() . "<br/>\n");

var_dump($_POST);
$name = $_POST["baseName"];
$content = $_POST["content"];


// decode base 64
$data = substr($content, strpos($content, ",") + 1);
$decodedData = base64_decode($data);
// echo ($decodedData);






echo("baseName");
echo($name);
$name = 'uploaded/'.$name.date("YmdHis").".pdf";
// $name = 'uploaded/'.$name;
echo("new name:");
echo($name);

$myfile = fopen($name, "w") or die("Unable to open file!");
fwrite($myfile, $decodedData);
fclose($myfile);

// echo($content);




?>