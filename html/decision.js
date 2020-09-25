function getParam(name) {
	name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
		// console.log("result =");
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function go() {
    url = getParam('to');
    window.location.href = url;
}

document.querySelector('#go').addEventListener('click', () => {
    go();
})