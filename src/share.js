import './share.less';
import {defer, domReady} from './lib/promise';
import * as Clock from './clock';

var deferred = defer();
export var ready = () => deferred.promise;

function sharing(e, type) {
    if (type === 'weixin') {
        e.preventDefault();
        var $weixinCode = document::$find('#share-weixin');

        $weixinCode::$show()
            ::$on('click', function handler() {
                $weixinCode::$off('click', handler);
                $weixinCode::$hide();
            });
    } else if (type === 'weibo') {
        e.preventDefault();
        WB2.anyWhere(function(W){
            W.widget.publish({
                action:"pubilish",
                type:"web",
                language:"zh_cn",
                button_type:"gray",
                button_size:"middle",
                default_text:"600米高空的风，居然会唱歌!？",
                refer:"y",
                default_image:"http%3A%2F%2Fww4.sinaimg.cn%2Fmw690%2F66101445gw1exfnkc5fgkj20m80goq3r.jpg",
                appkey:"3Nbb3f",
                id: "wb_publisher"
            });
        });
    }
}

var $share;
export async function show() {
    $share::$show()
        ::$on('click', 'a', function(e) {
            var type = this.className;
            sharing(e, type);
        });
}

const FACEBOOK_SHARE = 'https://www.facebook.com/dialog/share?' +
  'app_id=1645611472322802' + 
  '&display=page' + 
  '&href=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2F' + 
  '&redirect_uri=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Fexplorer';

function template() {
    return `
        <div id="share">
            <span>Copyright &copy; 2015 PAFC, All Rights Reserved</span>
            <a class="weibo"></a>
            <a class="weixin"></a>
            <a href="${FACEBOOK_SHARE}" target="_blank" class="facebook"></a>
        </div>
        <div id="share-weixin"></div>
    `;
}

(async () => {
    await Promise.all([
        domReady(),
        Clock.timeReady()
    ]);

    $share = document.body::$append(template()) 
            ::$find('#share')
            ::$addClass(Clock.state() === 'daylight'?'black':'white');

    deferred.resolve();

})();