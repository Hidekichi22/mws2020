const redirect_html = chrome.extension.getURL("./html/alert.html");


function redirect(requestDetails){
    var url = redirect_html + '?to=' + requestDetails.url;
    console.log(url);
    return {redirectUrl: url};
}

function redirectHandler(requestDetails){
    // Gmailでリンクをクリックして遷移した場合
    console.log(requestDetails.originUrl);
    if (requestDetails.originUrl.split('/')[2] == 'mail.google.com') {
        browser.webRequest.onBeforeRequest.addListener(
            // callback: このイベントが発生したときに呼び出される関数
            htmlFilter,
            // filter: このリスナーに送信されるイベントを制限するフィルタ
            { urls:['*://*/*'], types:['main_frame'] },
            // blocking: リクエストを同期化してリクエストをキャンセルまたはリダイレクトできるようにする
            ['blocking']
        );
    } else {
        // Gmail以外からだった時の処理(テスト用)
        console.log(requestDetails.url.split('/')[2]);
    }
}

async function checkCertificate(requestDetails){
    try{
        let securityInfo = await browser.webRequest.getSecurityInfo(requestDetails.requestId, {'certificateChain': false});
        console.log(securityInfo)

        if (!securityInfo['certificates'][0]['issuer'].match(/O=|OU=/)){
            //警告の処理
            var url = redirect_html + '?to=' + requestDetails.url;
            console.log(url);
            return {redirectUrl: url};
        }
        else{
            console.log('secureでーす');
        }
    }
    catch(error){
        console.error(error); 
    }
}

function htmlFilter(requestDetails){
    let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
    let decoder = new TextDecoder('utf-8');
    let data = [];
    let finance = true;

    filter.ondata = event => {    // データを受け取ったら(パケットに小分けされて何回も受け取る)
        data.push(event.data);    // データをスタックに積む
        filter.write(event.data); // データをブラウザにわたす
    }

    filter.onstop = event => {    // データをすべて受け取り終わったら
        // スタックに積んだデータを文字列にデコード
        let str = '';
        for (let buffer of data) { str += decoder.decode(buffer, {stream: true}) }
        str += decoder.decode();  // end-of-stream

        // 空白, 改行を削除
        str = str.replace(/(\s+|\r\n|\n|\r)/gm,'');
        // headタグを抽出
        let head = str.match(/<head>.*<\/head>/);
        // headタグがあれば次の処理に遷移
        if (head != null) {
            head = head[0];

            // ここにフィルタ処理を追加する
            // 金融であればfinance=true
            // else finanse=false
            console.log(head);
        }
        // フィルタオブジェクトを終了する
        filter.close(); 
    }
    // 証明書の取得
    if (finance){
        browser.webRequest.onHeadersReceived.addListener(
            checkCertificate,
            { urls:['http://*/*', 'https://*/*'], types:['main_frame'] },
            ['blocking']
        );
    }
}

browser.webRequest.onBeforeRedirect.addListener(
  redirectHandler,
  { urls: ['https://www.google.com/url?*'] }
);
