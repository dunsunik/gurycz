<?
require_once("phpfastcache/phpfastcache.php");
phpFastCache::setup("storage","auto");

// simple Caching with:
$cache = phpFastCache();

$key = $_GET['phpcache_key'];
$method = $_GET['phpcache_method'];
$ttl = $_GET['phpcache_ttl'];

error_log($_SERVER['REQUEST_URI']);


$url = $key;
$orig_callback = preg_replace('/.*&jsoncallback=(angular\.callbacks\._[^&]*)&.*/', '\1', $key);
$key = preg_replace('/&jsoncallback=angular\.callbacks\._[^&]*&/', '&', $key);

// clean
if($method == "clean") {
	$cache->clean();
}
// delete
elseif($method == "delete") {
	$cache->delete($key);
}
// stats
elseif($method == "stats") {
	echo '<pre>';
	print_r($cache->stats());
	echo '</pre>';
}
else {
	$result = $cache->get($key);

	if($result == null) {
		$result = file_get_contents($url);
		$cache->set($key, $result , $ttl);
	}

	header('Content-Type: application/json');


	$result = $orig_callback . "(" . preg_replace('/^angular\.callbacks\._[^(]*\((.*)\)$/', '\1', $result) . ")";
	echo $result;
}
?>
