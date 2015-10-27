import './share.less';
import {defer, domReady} from './lib/promise';

function sharing(type) {
    if (type === 'weixin') {
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
    document::$find('#share')
        ::$show()
        ::$on('click', 'a', function(e) {
            var type = this.className;
            sharing(type);
        });
}

function template() {
    return `
        <div id="share">
            <span>Copyright &copy; 2015 PAFC, All Rights Reserved</span>
            <a class="weibo"></a>
            <a class="weixin"></a>
            <a class="facebook"></a>
        </div>
        <div id="share-weixin"></div>
    `;
}

(async () => {
    await domReady();
    document.body::$append(template());
})();