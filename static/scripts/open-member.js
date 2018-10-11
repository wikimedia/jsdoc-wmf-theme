window.addEventListener('DOMContentLoaded', function () {
  if ( window.location.hash ) {
    openMember();
    window.setTimeout( function () {
      window.scrollTo( 0, (window.pageYOffset || document.documentElement.scrollTop) - 72);
    }, 0)
  }
});

window.addEventListener( 'hashchange', function (e) {
  e.stopPropagation();
  openMember();
} );

function openMember() {
  var id = window.location.hash.substr(1),
    toggler = document.getElementById( 'toggle-' + id ),
    offset = toggler.getBoundingClientRect().top,
    y = window.scrollY + offset - 62 - 10;
  if ( toggler ) {
    toggler.checked = true;
  }
  window.scrollTo(0, y);
}
