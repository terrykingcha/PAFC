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
    }
}

var $share;
export async function show() {
    $share::$show()
        ::$on('click', 'a', function(e) {
            var type = this.className.replace(/\b(on|off|iconfont|bounceIn|\s)\b/ig, '');
            sharing(e, type);
        });

    WB2.anyWhere(function(W){
        W.widget.publish({
            action:"pubilish",
            toolbar:"",
            type:"web",
            language:"zh_cn",
            position: "c",
            default_text:"600米高空的风，居然会唱歌!？",
            default_image:"http%3A%2F%2Fww3.sinaimg.cn%2Fmw690%2F624af76dgw1exypoesja7j20go0m8gmj.jpg",
            tag:"深圳平安风之音乐会",
            refer:"y",
            appkey:"3Nbb3f",
            id: "wb_publisher"
        });
    });
}

const FACEBOOK_SHARE = 'https://www.facebook.com/dialog/feed?' +
  'app_id=1645611472322802' + 
  '&display=page' + 
  '&caption=At%20600m%20in%20the%20atmosphere%2C%20we%20managed%20to%20capture%20nature.' + 
  '&link=' + encodeURIComponent(location.href) +  
  '&redirect_uri=' + encodeURIComponent(location.href);

function template() {
    return `
        <div id="share">
            <span>Copyright &copy; 2015 Shenzhen PAFC, All Rights Reserved</span>
            <a class="weibo iconfont bounceIn" id="wb_publisher">&#xe606;</a>
            <a class="weixin iconfont bounceIn">&#xe605;</a>
            <a class="facebook iconfont bounceIn" href="${FACEBOOK_SHARE}" target="_blank">&#xe607;</a>
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