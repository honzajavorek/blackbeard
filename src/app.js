/**
 * Cap'n Blackbeard's ship.
 */

$(document).ready(function() {
	
	var getRemote = function(url, success) {
		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'html',
			success: success
		});
	};
	
	function round(num, dec) {
		var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10,dec);
		return result;
	}
	
	/* Search form */
	$('form').submit(function(e) {
		e.preventDefault();
		var video_title = $('[type="search"]', this).val();
		
		if (video_title.length) {
			$('section').empty().hide();
			
			if ($('#feeling-lucky', this).prop('checked')) {
				selectVideo({
					url: null,
					title: video_title,
					titles: [video_title],
					desc: 'Přímá fráze z vyhledávání.',
					ranking: 0,
					rating: 0
				});
				
			} else {
				getRemote('http://www.csfd.cz/hledat/?q=' + encodeURIComponent(video_title), getCsfd);
			}
		}
	});
	
	/* CSFD */
	var getCsfd = function(response) {
		$('#csfd').remove();
		var ul = $('<ul id="csfd"></ul>');
		response = $(response.responseText);
		
		// film page
		if ($('#pg-film', response).length) {
			identifyFilm({}, response);
			return;
		}
		
		// search page
		response.find('#search-films .ui-image-list li').each(function(i, item) {
			var h3 = $(item).find('h3');
			
			var title = h3.text();
			var link = $('a', h3);
			var url = 'http://www.csfd.cz' + link.attr('href');
			var desc = $('p', item).eq(0).text();
			
			var ranking = 0;
			if (link.hasClass('c1')) {
				ranking = 3;
			} else if (link.hasClass('c2')) {
				ranking = 2;
			} else if (link.hasClass('c3')) {
				ranking = 1;
			}
			
			li = $('<li class="video rank-' + ranking + '"><h3>' + title + ' <a href="' + url + '" target="_blank">ČSFD</a></h3><small>' + desc + '</small><button>✔</button></li>');
			li.data('film', {url: url, title: title, desc: desc, ranking: ranking});
			li.appendTo(ul);
		});
		
		$('.films').append(ul).show();
		$('.films button').click(function() { identifyFilm($(this).closest('li').data('film')); });
	};
	
	/* Getting more information */
	var identifyFilm = function(film, filmPageResponse) {
		if (!filmPageResponse) {
			getRemote(film.url, function(response) {
				response = $(response.responseText);
				identifyFilm(film, response);
			});
			return;
		}
		response = filmPageResponse;
		
		var titles = [];
		$('.info h1, .info h3', response).each(function() {
			var t = $(this).text();
			if ($.inArray(t, titles) < 0) {
				if (t.match(/, The$/) || t.match(/^The /)) {
					titles.push(t.replace(/, The$/, '').replace(/^The /, ''));
				}
				titles.push(t);
			}
		});
		
		var rating = parseInt($('#rating', response).text().replace('%', ''));
		var ranking = 0;
		if (rating > 70) {
			ranking = 3;
		} else if (rating < 70 && rating > 30) {
			ranking = 2;
		} else if (rating < 30 && rating > 0) {
			ranking = 1;
		}
		
		selectVideo({
			url: 'http://www.csfd.cz' + $('.navigation a[href^="/film"]', response).attr('href').replace(/(\/film\/[^\/]+\/).*$/, '$1'),
			title: $('.info h1', response).text(),
			titles: titles,
			desc: $('.genre', response).text() + ', ' + $('.origin', response).text(),
			ranking: ranking,
			rating: rating
		});
	};
	
	/* Video selection */
	var selectVideo = function(video) {
		$('.films').hide();
		section = $('.results');
		
		link = (video.url)? ' <a href="' + video.url + '" target="_blank">ČSFD</a>' : '';
		header = $('<header id="selected" class="video rank-' + video.ranking + '"><h3>' + video.title + link + '</h3><small>' + video.desc + '</small></header>');
		header.data('video', video);
		section.append(header);
		
		section.append('<h2>The Pirate Bay</h2><ul id="tpb"></ul>');
		askTpb(video);
		
		section.append('<h2>Ulož.to</h2><ul id="ulozto"></ul>');
		askUlozto(video);
		
		section.append('<h2>Titulky.com</h2><ul id="titulkycom"></ul>');

		section.show();
	};
	
	/* Uloz.to */
	var askUlozto = function(video) {
		for (var i = 0; i < video.titles.length; i++) {
			var title = video.titles[i];
			$('#ulozto').append('<li>→ <a href="http://www.uloz.to/hledej/?category=2&type=ratings&q=' + encodeURIComponent(title) + '" target="_blank">' + title + '</a></li>');
		}
	};
	
	/* The Pirate Bay */
	var askTpb = function(video) {
		var counter = video.titles.length;
		for (var i = 0; i < video.titles.length; i++) {
			var title = video.titles[i];
			getRemote('http://thepiratebay.org/search/' + encodeURIComponent(title) + '/0/7/200', function(response) {
				$('.detName', $(response.responseText)).each(function(i, item) {
					if (i > 4) {
						return;
					}
					var name = $(item).text();
					var link = 'http://www.thepiratebay.org' + $('a', item).attr('href');
					var td = $(item).closest('td');
					var download = $('img.dl', td).closest('a').attr('href');
					var size = $('.detDesc', td).text().match(/([\d\.]+\s+[GM]iB)/)[0].replace(/\s+/, ' ');
					
					li = $('<li><a href="' + download + '">↓</a> <h3><a href="' + link + '" target="_blank">' + name + '</a></h3> <small>' + size + '</small></li>');
					li.data('file', {name: name, size: size});
					$('#tpb').append(li);
				});
				
				if (!--counter) {
					askTitulkycom(video); // to be sure TPB is loaded already!
				}
			});
		}
	};
	
	/* Titulky.com */
	var askTitulkycom = function(video) {
		for (var i = 0; i < video.titles.length; i++) {
			var title = video.titles[i];
			var searchUrl = 'http://www.titulky.com/index.php?orderby=-9&Fulltext=' + encodeURIComponent(title);
			//$('#titulkycom').append('<li>→ <a href="' + searchUrl + '" target="_blank">' + title + '</a></li>');
			
			getRemote(searchUrl, function(response) {
				$('.main_table img', $(response.responseText)).each(function(i, item) {
					if (i > 4) {
						return;
					}
					
					var tr = $(item).closest('tr');
					var name = $('a', tr).eq(1).attr('title');
					var link = 'http://www.titulky.com/' + $('a', tr).attr('href');
					var popularity = parseInt($('td', tr).eq(5).text());
					var lang = $('td', tr).eq(6).text();
					var cds = parseInt($('td', tr).eq(7).text());
					
					var size = parseFloat($('td', tr).eq(8).text().replace(/MB$/));
					if (size > 1000.0) {
						size = round((size / 1000.0), 2) + ' GiB';
					} else {
						size += ' MiB';
					}
					
					li = $('<li><a href="' + link + '" target="_blank">↓</a> <h3>' + name + '</h3><br><small>' + cds + ' CD, <strong>' + size + '</strong>, ' + lang + '</small></li>');
					li.data('subtitles', {name: name, size: size});
					$('#titulkycom').append(li);
				});
			});
		}
	};
});