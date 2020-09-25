

function redirectHandler(requestDetails){
    // Gmailでリンクをクリックして遷移した場合
    if (requestDetails.originUrl.split('/')[2] == 'mail.google.com') {
        browser.webRequest.onBeforeRequest.addListener(
            // callback: このイベントが発生したときに呼び出される関数
            htmlFilter,
            // filter: このリスナーに送信されるイベントを制限するフィルタ
            { urls:['*://*/*'], types:['main_frame'] },
            // blocking: リクエストを同期化してリクエストをキャンセルまたはリダイレクトできるようにする
            ['blocking']
        );
        //console.log(requestDetails);
    } else {
        // Gmail以外からだった時の処理(テスト用)
        console.log("Hello world!");
        console.log(requestDetails.url.split('/')[2]);
    }
}

function readBlacklist(){
    //console.log("In readBlacklist");
    blacklist=[];
    bl={};
    var rawFile=new XMLHttpRequest();

    //rawFile.overrideMimeType("application/json");

    //リクエストの初期化 open(method, url, async, user, password)
    rawFile.open("GET", "./blackcollection.json", true);

    console.log(rawFile.status);
    console.log(rawFile.readyState);

    rawFile.onload=function(){
        bl = JSON.parse(this.responseText);
        console.log(bl);
        blacklist.push(bl);
    }

    rawFile.send(null); //リクエストの送信
    return bl;
}


function htmlFilter(requestDetails){
    let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
    let decoder = new TextDecoder('utf-8');
    let data = [];
    var blacklist;

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

            console.log(head);

            bll=readBlacklist();
            console.log(bll);

        }
    }

    // 証明書の取得
    browser.webRequest.onHeadersReceived.addListener(
        async function(requestDetails){
            try {
                let securityInfo = await browser.webRequest.getSecurityInfo(requestDetails.requestId, {"certificateChain": true})
                //console.log(securityInfo)
            }
            catch(error){ console.error(error) }
        },
        { urls:['*://*/*'], types:['main_frame'] }
    );
}

browser.webRequest.onBeforeRedirect.addListener(
  redirectHandler,
  { urls: ['https://www.google.com/url?*'] }
);
