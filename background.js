browser.webRequest.onBeforeRedirect.addListener(
    redirectHandler,
    // https://www.google.com/url?q=https://www.jitec.ipa.go.jp/1_0…&ust=1601015058773000&usg=AFQjCNE-_w9GbDZj_1RbkCsJl3nO0dQ1Cw
    { urls: ['https://www.google.com/url\?q=http*'] }
);


const redirectDst = chrome.extension.getURL("html/alert.html");

function redirect(requestDetails){
    var u = redirectDst + '?to=' + requestDetails.url;
    console.log(u);
    return {redirectUrl: u};
}


function redirectHandler(requestDetails) {
    let distUrl = requestDetails.url.split('/')[5];
    // Gmailでリンクをクリックして遷移した場合
    if (requestDetails.originUrl.split('/')[2] == 'mail.google.com') {
        // 既にハンドラがある場合リセットする
        if (browser.webRequest.onHeadersReceived.hasListener(htmlFilter)){
            browser.webRequest.onHeadersReceived.removeListener(htmlFilter);
        }
        browser.webRequest.onHeadersReceived.addListener(
            htmlFilter,
            { urls: ['*://'+distUrl+'/*'], types: ['main_frame'] },
            ['blocking'] // リクエストを同期化してリクエストをキャンセルまたはリダイレクトできるようにする
        );
    }
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
            // *****************************************************
            console.log(head);
            // ここにフィルタ処理を追加する
            /*
             * const blackcollection = [
		        "投資","預金","外貨","預金","金利","利息","債券","デビット","外貨預金","投資信託","信用金庫","住宅ローン","かりる","教育ローン","そなえる","ネットバンク","ためる・ふやす","定期預金","バンキング","個人のお客さま","貸金庫","リフォームローン","店舗・ATM","カードローン","フリーローン","マイカーローン","電子公告","口座開設","資料請求","手数料一覧","保険募集指針","円預金","利益相反管理方針","終身保険","個人年金保険","金庫","店舗・ATMのご案内","保険商品","確定拠出年金","勧誘方針","資金調達","総合口座","クレジットカード","資産","ログイン","株主総会","口座","各種手数料","損害保険","両替","トップメッセージ","外貨両替","IRカレンダー","火災保険","ローン","個人情報保護宣言","各種お手続き","預金保険制度について","普通預金","株主・投資家の皆さま","決算短信","便利につかう","貯蓄預金","公共債","生命保険","外国送金","デビットカード","セキュリティ","手数料","金利一覧","金利情報","金融商品勧誘方針","プライバシーポリシー","ニュースリリース一覧","ディスクロージャー誌","預金金利","証券","個人投資家の皆さまへ","キャッシング","経営理念","自動送金サービス","財務ハイライト","スマホ決済サービス","国債","資産運用","セカンドライフ","スピード王MAX","中期経営計画","銀行","ATM","ディスクロージャー","学資保険"
	        ];
	        var counter = 0;	//サイトヘッダーとキーワードの一致数カウント    
	        for(let i = 0;i <blackcollection.length; i++){
	            if(head.match(blackcollection[i])){
		            counter += 1;
		        }
	        }
	        console.log("The number of keywords in the header is..." + counter);

            if(counter > 0){
                finance = true;
                console.log("finance=true");      // 金融であればfinance=true
            }else{
                finance = false;
                console.log('finanse=false');    // else finanse=false
            }
            

            */
            var finance = true;
            console.log(cert);
            cert.then(value => {
                if (value['state'] != 'insecure'){
                    if (!value['certificates'][0]['issuer'].match(/O=|OU=/)) {
                        console.log('secure');
                    }
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
/*
function bankwordCheck(head){
    let words = ['外貨預金','投資信託','採用情報','住宅ローン','かりる','教育ローン','そなえる','よくあるご質問','ためる・ふやす',
                 '定期預金','サイトマップ','個人のお客さま','ニュースリリース','貸金庫','リフォームローン','お知らせ','店舗・ATM',
                 'カードローン','フリーローン','マイカーローン','電子公告','口座開設','資料請求','法人のお客さま','手数料一覧',
                 '保険募集指針','円預金','利益相反管理方針','終身保険','個人年金保険','お問い合わせ'];
    let j = false;
    console.log(1);
    for (let w of words) {
        var m = head.match(w)
        if (m != null) {
            console.log(m);
            j = true;
            break;
        }
    }
    if (!j) {
        console.log(head);
    }
}*/
