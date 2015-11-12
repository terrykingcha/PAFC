import './share.less';
import {defer, domReady} from './lib/promise';

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
                default_image:"http%3A%2F%2Fww3.sinaimg.cn%2Fmw690%2F624af76dgw1exypoesja7j20go0m8gmj.jpg",
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

const FACEBOOK_SHARE = 'https://www.facebook.com/dialog/feed?' +
  'app_id=1645611472322802' + 
  '&display=page' + 
  '&caption=At%20600m%20in%20the%20atmosphere%2C%20we%20managed%20to%20capture%20nature.'
  '&href=' + encodeURIComponent(location.href) +  
  '&redirect_uri=' + encodeURIComponent(location.href);

function template() {
    return `
        <div id="share">
            <span>Copyright &copy; 2015 Shenzhen PAFC, All Rights Reserved</span>
            <a class="weibo"></a>
            <a class="weixin"></a>
            <a href="${FACEBOOK_SHARE}" target="_blank" class="facebook"></a>
        </div>
        <div id="share-weixin"></div>
    `;
}

(async () => {
    await Promise.all([
        domReady()
    ]);

    $share = document.body::$append(template())::$find('#share')
    deferred.resolve();

})();