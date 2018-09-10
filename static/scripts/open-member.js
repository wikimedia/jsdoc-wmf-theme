if ( window.location.hash ) {
  openMember();
}

window.addEventListener( 'hashchange', openMember )

function openMember() {
  var id = window.location.hash.substr(1);
  var toggler = document.getElementById( 'toggle-' + id );
  if ( toggler ) {
    toggler.checked = true;
  }
}
