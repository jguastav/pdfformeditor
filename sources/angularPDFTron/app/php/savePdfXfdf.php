<?php
echo (getcwd() . "<br/>\n");
$name = $_POST["baseName"];
$content = $_POST["content"];

echo("baseName\n");
echo($name."\n");
$name = 'uploaded/'.$name.date("YmdHis").".xfdf";
// $name = 'uploaded/'.$name;
echo("new name:");
echo($name."\n");

$myfile = fopen($name, "w") or die("Unable to open file!");
fwrite($myfile, $content);
fclose($myfile);

// echo($content);

 ?>
