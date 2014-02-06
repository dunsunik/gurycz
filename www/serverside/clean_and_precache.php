<?
function get_url($url, $no_background) {
	return "wget -q 'http://" . $_SERVER["SERVER_NAME"] . $url . "'" . ($no_background ? "" : " > /dev/null 2>/dev/null &");
}

// clean
exec(get_url("/serverside/cache.php?phpcache_method=clean", 1));

// precache

$urls = array(
	// gallery list
	"/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=http%3A%2F%2Fapi.flickr.com%2Fservices%2Frest%2F%3Fformat%3Djson%26jsoncallback%3Dangular.callbacks._0%26api_key%3Dacc0d15f07c3f8cb5838d583971cc3e5%26user_id%3D30314549%40N02%26per_page%3D100%26method%3Dflickr.photosets.getList%26primary_photo_extras%3Ddate_taken%2Curl_m",
	// people
	"/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=http%3A%2F%2Fapi.flickr.com%2Fservices%2Frest%2F%3Fformat%3Djson%26jsoncallback%3Dangular.callbacks._2%26api_key%3Dacc0d15f07c3f8cb5838d583971cc3e5%26user_id%3D30314549%40N02%26per_page%3D100%26page%3D1%26tags%3Dpeople%26method%3Dflickr.photos.search%26extras%3Doriginal_format%2Cdate_taken%2Curl_o%2Co_dims%2Curl_q%2Cq_dims",
	// landscape
	"/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=http%3A%2F%2Fapi.flickr.com%2Fservices%2Frest%2F%3Fformat%3Djson%26jsoncallback%3Dangular.callbacks._3%26api_key%3Dacc0d15f07c3f8cb5838d583971cc3e5%26user_id%3D30314549%40N02%26per_page%3D100%26page%3D1%26tags%3Dlandscape%26method%3Dflickr.photos.search%26extras%3Doriginal_format%2Cdate_taken%2Curl_o%2Co_dims%2Curl_q%2Cq_dims",
	// macro
	"/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=http%3A%2F%2Fapi.flickr.com%2Fservices%2Frest%2F%3Fformat%3Djson%26jsoncallback%3Dangular.callbacks._4%26api_key%3Dacc0d15f07c3f8cb5838d583971cc3e5%26user_id%3D30314549%40N02%26per_page%3D100%26page%3D1%26tags%3Dmacro%26method%3Dflickr.photos.search%26extras%3Doriginal_format%2Cdate_taken%2Curl_o%2Co_dims%2Curl_q%2Cq_dims",
	// topten
	"/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=http%3A%2F%2Fapi.flickr.com%2Fservices%2Frest%2F%3Fformat%3Djson%26jsoncallback%3Dangular.callbacks._5%26api_key%3Dacc0d15f07c3f8cb5838d583971cc3e5%26user_id%3D30314549%40N02%26per_page%3D100%26page%3D1%26tags%3Dtopten%26method%3Dflickr.photos.search%26extras%3Doriginal_format%2Cdate_taken%2Curl_o%2Co_dims%2Curl_q%2Cq_dims"
);


// get all galleries
$list = file_get_contents("http://api.flickr.com/services/rest/?format=json&api_key=acc0d15f07c3f8cb5838d583971cc3e5&user_id=30314549@N02&per_page=100&method=flickr.photosets.getList&primary_photo_extras=date_taken,url_m");
$list = preg_replace('/^jsonFlickrApi\((.*)\)/','\1', $list);
$decoded = json_decode($list);
foreach($decoded->{'photosets'}->{'photoset'} as $item) {
	array_push($urls, 
	"/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=http%3A%2F%2Fapi.flickr.com%2Fservices%2Frest%2F%3Fformat%3Djson%26jsoncallback%3Dangular.callbacks._1%26api_key%3Dacc0d15f07c3f8cb5838d583971cc3e5%26user_id%3D30314549%40N02%26per_page%3D100%26page%3D1%26photoset_id%3D" . $item->{'id'} . "%26method%3Dflickr.photosets.getPhotos%26extras%3Doriginal_format%2Cdate_taken%2Curl_o%2Co_dims%2Curl_q%2Cq_dims");
}

// fetch all data
foreach($urls as $url) {
	exec(get_url($url));
}
?>
