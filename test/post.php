<?php
$data = file_get_contents("php://input");
$query = print_r($_GET, true);

echo "QUERY: $query\nDATA: $data";
?>
