<?php 

echo (getcwd() . "<br/>\n");

if (!function_exists('file_put_contents')) {
    function file_put_contents($filename, $data) {
		echo("old function : ".filename."\n");
        $f = @fopen($filename, 'w');
        if (!$f) {
            return false;
        } else {
            $bytes = fwrite($f, $data);
            fclose($f);
            return $bytes;
        }
    }
}

print_r($_FILES);
$fileName = $_FILES['file']['name'];
$fileType = $_FILES['file']['type'];
$fileError = $_FILES['file']['error'];
$fileSize = $_FILES['file']['size'];
	echo("before file_get_contents<br/>");

$fileContent = file_get_contents($_FILES['file']['tmp_name']);

if($fileError == UPLOAD_ERR_OK){
	echo("uploading file no error<br/>");
	if ($fileSize<5000000) {
		$file = 'uploaded/lastUploaded.pdf';
		// Open the file to get existing content
		$current = $fileContent;
		// Write the contents back to the file
		file_put_contents($file, $current);
		
	}

   //Processes your file here
}else{
   switch($fileError){
     case UPLOAD_ERR_INI_SIZE:   
          $message = 'Error al intentar subir un archivo que excede el tamaño permitido.';
          break;
     case UPLOAD_ERR_FORM_SIZE:  
          $message = 'Error al intentar subir un archivo que excede el tamaño permitido.';
          break;
     case UPLOAD_ERR_PARTIAL:    
          $message = 'Error: no terminó la acción de subir el archivo.';
          break;
     case UPLOAD_ERR_NO_FILE:    
          $message = 'Error: ningún archivo fue subido.';
          break;
     case UPLOAD_ERR_NO_TMP_DIR: 
          $message = 'Error: servidor no configurado para carga de archivos.';
          break;
     case UPLOAD_ERR_CANT_WRITE: 
          $message= 'Error: posible falla al grabar el archivo.';
          break;
     case  UPLOAD_ERR_EXTENSION: 
          $message = 'Error: carga de archivo no completada.';
          break;
     default: $message = 'Error: carga de archivo no completada.';
              break;
    }
      echo json_encode(array(
               'error' => true,
               'message' => $message
            ));
}

?>