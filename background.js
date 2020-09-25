const wordlist = readFinanceWordlist();
const redirectDst = chrome.extension.getURL('html/alert.html');

browser.webRequest.onBeforeRedirect.addListener(
    redirectHandler,
    { urls: ['https://www.google.com/url\?q=http*'] }
);

function redirectHandler(requestDetails) {
    // Gmailでリンクをクリックして遷移した場合
    if (requestDetails.originUrl.split('/')[2] == 'mail.google.com') {
        // 既にハンドラがある場合リセットする
        if (browser.webRequest.onHeadersReceived.hasListener(htmlFilter)) {
            browser.webRequest.onHeadersReceived.removeListener(htmlFilter);
        }
        let dstUrl = requestDetails.url.split('/')[5];
        browser.webRequest.onHeadersReceived.addListener(
            htmlFilter,
            { urls: ['*://'+dstUrl+'/*'], types: ['main_frame'] },
            ['blocking'] // filterResponseData用
        );
    }
}

function htmlFilter(requestDetails) {
    // alert.htmlからリダイレクトした場合は何もせずreturnする
    srcUrl = requestDetails.originUrl.split('/')[2];
    if ((srcUrl != 'www.google.com') && (srcUrl != 'mail.google.com')) { return; }

    // 非同期にサーバ証明書を取得。サーバ証明書のissuerにOかOUがあったら信頼できるものとする
    let is_securecert = [];
    getCertificate(requestDetails.requestId).then(value => {
        console.log(value); // デバッグ用
        try {
            if (value['certificates'][0]['subject'].match(/(O=|OU=)/)) {
                is_securecert.push(true);
            } else {
                is_securecert.push(false);
                console.log('week certificate') // デバッグ用
            }
        } catch(error) {
            is_securecert.push(false);
            console.log('state is insecure') // デバッグ用
        }
    });

    // サーバから取得するデータをフィルタする
    let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
    let data = [];

    // データを受け取ったら動作する
    filter.ondata = event => {
        data.push(event.data);    // データをスタックに積む
        filter.write(event.data); // データをブラウザに渡す (filter.onstopで最後に一括で渡しても良い)
    }

    // データをすべて受け取り終わったら動作する
    filter.onstop = event => {
        // バッファにためたデータをデコードする
        let str = bufferDecoder(data, 'utf-8');
        // utf-8以外の文字コードの時デコードし直す
        let chartype = getChartype(str);
        if (chartype != 'utf-8') { str = bufferDecoder(data, chartype); }

        // headタグを抽出し、headタグがあれば次の処理に遷移する
        let head = getHead(str);
        if (head) {
            //console.log(head); // デバッグ用

            // head中から金融ワードリストをマッチングさせる
	        let counter = 0;
	        for (var i = 0; i < wordlist.length; i++) {
	            if (head.match(wordlist[i])) { counter += 1; }
	        }
	        //console.log("The number of keywords in the head is... " + counter); // デバッグ用

            // マッチングした個数が1個以上の場合、金融機関と判定する
            let is_finance = false;
            if (counter > 0){ is_finance = true; }
            console.log('is_finance= '+is_finance.toString()); // デバッグ用
            console.log('is_securecert= '+is_securecert[0].toString()); // デバッグ用

            // 金融機関と判定され、信用できない証明書と判定された場合、アラートページへリダイレクトする
            if (is_finance && !is_securecert[0]) {
                let encoder = new TextEncoder();
                let s = '<script>location.href="'+redirectDst+'?to='+requestDetails.url+'"</script>';
                filter.write(encoder.encode(s));
            }
        }
        filter.disconnect(); // フィルタオブジェクトを終了する
    }
    return;
}

async function getCertificate(id){
    try {
        let securityInfo = await browser.webRequest.getSecurityInfo(
            id,
            {'certificateChain': false}
        );
        return securityInfo;
    } catch(error) { console.error(error); }
}
