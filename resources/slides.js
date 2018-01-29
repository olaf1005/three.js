$(function() {
	$.deck('.slide');

  // Thanks to Steven Wittens for iframe preload, unload, and stepping
  // https://github.com/unconed/fullfrontal

  var speed = 1;

  window.iframes = [];

  // Go to specific step
  function directorGo(iframe, step) {
    iframe.contentWindow && iframe.contentWindow.postMessage({ director: { args: [step] }}, '*');
  }

  // Pre-load and unload iframes one frame before/after
  var $iframes = {};
  $('.slide').each(function (i) {
    var $this = $(this);
    var $parents = $this.parents('.slide');
    var mask = $this.is('.instant') ? [i, i+1] : [i-1, i, i+1];

    // Build index of which iframes are active per slide
    if ($parents.length) $this = $parents;
    $.each(mask, function (i,v) {
      $iframes[v] = ($iframes[v] || $()).add($this.find('iframe'));
    });
  });

  function disable(iframe) {
    if (!$(iframe).data('src')) {
      var src = $(iframe).attr('src');
      $(iframe).data('src', src);
      iframe.onload = null;
      iframe.src = 'about:blank';

      iframes.splice(iframes.indexOf(iframe), 1);
    }
  }

  function enable(iframe, step) {
    var src = $(iframe).data('src');
    if (src) {
      iframe.onload = function () {
        iframe.onload = null;
        directorGo(iframe, step);
      }
      iframe.src = src;
      $(iframe).data('src', null);

      iframes.push(iframe);
    }
  }

  // Hide all iframes
  $('iframe').each(function () {
    disable(this);
  });

  // Respond to presentation deck navigation
  var $frames = null;

	$(document).bind('deck.change', function (e, from, to) {
    var out = [];

    $('#message').remove();

    function getTopSlide(step) {
      var $slide = $.deck('getSlide', step),
          $parents = $slide.parents('.slide');

      if ($parents.length) {
        $slide = $parents;
      }

      return $slide;
    }

    var $subslide = $.deck('getSlide', to);
    var $slide = getTopSlide(to);
    var step = $slide.find('.slide').index($subslide) + 2;

    // Sync up iframes to correct step
    $frames = $slide.find('iframe');
    $frames.each(function () {
      directorGo(this, step);
    });

    // Start playing videos
    $slide.find('video').each(function () {
      this.play();
    });
    $('.deck-container')[$slide.find('iframe.youtube').length ? 'addClass' : 'removeClass']('flat');

    // Stop old videos
    setTimeout(function () {
      $.deck('getSlide', from).find('video').each(function () {
        this.pause();
      });
    }, 500 / speed + 80);

    // Start at beginning or end of slides
    var go = to > from ? 1 : -1;

    // Pre-load iframes (but allow time for current transition)
    $iframes[to].each(function () {
      var iframe = this;
      setTimeout(function () { enable(iframe, go); }, 500 / speed + 80);
    });

    // Unload old iframes
    $('iframe').not($iframes[to]).each(function () {
      disable(this);
    });

    // Google Analytics
    if (window.gtag) {
      gtag('event', 'page_view', {
        // todo: this is the same for all 3 .html files
        'page_path': '/slide-' + to
      });
    }

  });

  if ( location.hash == "" ) {
    location.hash = "slide-0";
  }


  // xbox controller navigation

  window.addEventListener( 'vr controller connected', function( event ){

    var controller = event.detail;

    function next( event ){
      $.deck('next');
    }

    function prev( event ){
      $.deck('prev');
    }

    if ( controller.style == 'xbox' ) {

      controller.addEventListener( 'bumper-right press began', next );
      controller.addEventListener( 'trigger-right press began', next );
      controller.addEventListener( 'd-right press began', next );
      controller.addEventListener( 'thumbstick-left right press began', next );
      controller.addEventListener( 'thumbstick-right right press began', next );

      controller.addEventListener( 'bumper-left press began', prev );
      controller.addEventListener( 'trigger-left press began', prev );
      controller.addEventListener( 'd-left press began', prev );
      controller.addEventListener( 'thumbstick-left left press began', prev );
      controller.addEventListener( 'thumbstick-right left press began', prev );

    } else {

      controller.addEventListener( 'primary press began', next );

    }

  });

  loop();
  function loop() {
    requestAnimationFrame( loop );
    THREE.VRController.update();
  }

});