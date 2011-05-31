<?php
/* Development script for PHP server. */

// every refresh compiles a new version
$output = '';
$ret = 0;
$command = '/usr/bin/python ' . dirname(__FILE__) . '/compile.py 2>&1';

$error = exec($command, $output, $ret);
if ($ret) {
	die($error);
}

// get the compiled verison and display it
$release = 'blackbeard_ver' . date('Y-m-d') . '.html';
echo file_get_contents('./releases/' . $release);
