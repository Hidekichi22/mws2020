function aho(html){
	var bl =    ;
	var result;

	for(var i=0;i<bl.length-1;i++){
		if (html.match(bl[i])) {
    			return True;
		};
	};

	return False;
};


console.log(result);

