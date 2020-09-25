const wordlist = readFinanceWordlist();
const redirectDst = chrome.extension.getURL('html/alert.html');

browser.webRequest.onBeforeRedirect.addListener(
    redirectHandler,
    // https://www.google.com/url?q=https://www.jitec.ipa.go.jp/1_0…&ust=1601015058773000&usg=AFQjCNE-_w9GbDZj_1RbkCsJl3nO0dQ1Cw
    { urls: ['https://www.google.com/url\?q=http*'] }
);

function redirectHandler(requestDetails) {
    console.log(requestDetails.url);
    // Gmailでリンクをクリックして遷移した場合
    if (requestDetails.originUrl.split('/')[2] == 'mail.google.com') {
        // 既にハンドラがある場合リセットする
        if (browser.webRequest.onHeadersReceived.hasListener(htmlFilter)){
            browser.webRequest.onHeadersReceived.removeListener(htmlFilter);
        }
        let distUrl = requestDetails.url.split('/')[5];
        browser.webRequest.onHeadersReceived.addListener(
            htmlFilter,
            { urls: ['*://'+distUrl+'/*'], types: ['main_frame'] },
            ['blocking'] // リクエストを同期化してリクエストをキャンセルまたはリダイレクトできるようにする
        );
    }
}

function readFinanceWordlist() {
    let wl = [];
    let rawFile = new XMLHttpRequest();
    rawFile.open('GET', '/blackcollection.json', true);
    rawFile.onload = () => {
        let wj = JSON.parse(rawFile.responseText);
        for (var i in wj) { wl.push(wj[i]); }
    }
    rawFile.send();
    return wl;
}

function bufferDecoder(data, chartype) {
    let decoder = new TextDecoder(chartype);
    let str = '';
    for (let buffer of data) { str += decoder.decode(buffer, {stream: true}); }
    str += decoder.decode();
    return str;
}

function getChartype(str) {
    let is_charset = str.replace(/(\"|\'|\s+|\/)/gm, '').match(/charset=.*/);
    if (is_charset != null) { return is_charset[0].split('>')[0].split('=')[1].toLowerCase() }
    else { return 'utf-8' }
}

function htmlFilter(requestDetails) {
    let cert = getCertificate(requestDetails.requestId);
    let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
    let data = [];

    filter.ondata = event => {    // データを受け取ったら動作
        data.push(event.data);    // データをスタックに積む
        filter.write(event.data); // データをブラウザにわたす
    }
    filter.onstop = event => {    // データをすべて受け取り終わったら動作
        let str = bufferDecoder(data, 'utf-8');
        // utf-8以外の文字コードの時デコードし直す
        let chartype = getChartype(str);
        if (chartype != 'utf-8') { str = bufferDecoder(data, chartype); }
        // 空白, 改行を削除
        str = str.replace(/(\s+|\r\n|\n|\r)/gm, '');
        // headタグを抽出
        let head = str.match(/<head>.*<\/head>/);
        // headタグがあれば次の処理に遷移
        if (head != null) {
            head = head[0];
            console.log(head);
            // *****************************************************
	        var counter = 0;	//サイトヘッダーとキーワードの一致数カウント
	        for(var i = 0; i < wordlist.length; i++){
	            if(head.match(wordlist[i])){
		            counter += 1;
		        }
	        }
	        console.log("The number of keywords in the header is..." + counter);

            if(counter > 0){
                console.log("finance=true");      // 金融であればfinance=true
            }else{
                console.log('finanse=false');    // else finanse=false
            }

            console.log(cert);
            cert.then(value => {
                try{
                    var certificate = value['certificates'][0]['issuer'].match(/O=|OU=/);
                } catch(error) {
                    var certificate = false
                }
                if (!certificate && finance){
                    //ポップアップ表示
                    console.log('insecure');
                    browser.webRequest.onBeforeRequest.addListener(
                        redirect,
                        { urls: ['https://*/*'], types: ['main_frame'] },
                        ['blocking']
                    )
                }
            });
            // *****************************************************

        }
        filter.disconnect();           // フィルタオブジェクトを終了する
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

function redirect(requestDetails){
    var u = redirectDst + '?to=' + requestDetails.url;
    console.log(u);
    return {redirectUrl: u};
}

