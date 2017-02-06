<?php
$name = $_POST["baseName"];
$content = $_POST["content"];

echo("baseName");
echo($name);
$name = 'uploaded/'.$name.date("YmdHis").".xfdf";
// $name = 'uploaded/'.$name;
echo("new name:");
echo($name);

$myfile = fopen($name, "w") or die("Unable to open file!");
fwrite($myfile, $content);
fclose($myfile);

// echo($content);

 ?>
