import './video.less';
import {defer, domReady, delay} from './lib/promise';
import {manager, onProgress, onError} from './prologue';

var $video;
export async function show() {
    $video::$show();
    await delay(10);
    $video::$addClass('show');
    await delay(650);
}

export async function hide() {
    $video::$addClass('hide');
    await delay(650);
    $video::$removeClass('show hide');
}

const PATH = './assets/images/video';
const VIDEO = './assets/videos/project.mp4';
function template() {
    return `
        <div id="video">
            <div class="scrollWrap">
                <div class="scrollElement">
                    <div class="slogan"></div>
                    <section>
                        <p class="en">Among all the sounds in nature, wind is the most mysterious. It is a messenger of nature, wind communicates to humans. Our Team, the Creators from Saatchi & Saatchi GZ, try to collect these messages.We want to re-express nature found in prosperity,  through a Concert of the Wind.</p>
                        <p class="cn">大自然的声音里面，风是最神秘的。以风为信使，大自然向人们传递讯息。我们的团队，广州 Saatchi & Saatchi 的创意者们，尝试把这些信息收集起来。用一场风的音乐会，让人们再次重视繁华下的自然。</p>
                    </section>
                    <video controls
                        crossorigin="anonymous"
                        poster="${PATH}/poster.jpg"
                        preload="auto">
                    </video>
                    <section>
                        <p class="en">First, we look for the best location to catch the wind. Shenzhen mirrors China in its miraculous speed of progress. And 600 meters PAFC is at the top of Shenzhen, where the sky, land and humans meet. This is where the wind chose.</p>
                        <p class="cn">首先要找到合适的捕风地。深圳速度堪称为奇迹，是中国的缩影。600米高的PAFC（深圳平安金融大厦）就在这个奇迹之颠。这里，连接天、地与人，没有比这更适合的了，是风选择了这里。</p>
                        <p class="en">It is more difficult to preserve wind as it is than to change it. We had to do a lot of calculations to create this instrument, which is designed specifically to catch the sound of the wind.<br>We invite the artists from Nexus Interactive Arts to design such a special windtrument. </p>
                        <p class="cn">保留风的原貌比改变它更难。为了捕捉到风的原始形态，需要经过精密计算，设计特殊乐器收集这些珍贵的音频。为此，我们邀请了伦敦艺术团队Nexus Interactive Arts，耗时2个月，设计了这一独特的捕风装置。</p>       
                    </section>
                    <div class="banner">
                        <img src="${PATH}/banner.jpg" width="70%" />
                    </div>
                    <div class="img">
                        <img src="${PATH}/01.jpg" width="70%" />
                    </div>
                    <div class="img">
                        <img src="${PATH}/02.jpg" width="70%" />
                    </div>
                    <div class="img">
                        <img src="${PATH}/03.jpg" width="70%" />
                    </div>
                    <section>
                        <p class="en">The wind is collected at one end and the pure sounds of nature is saved after travelling the length of each tube, thereby preserving the true, original sound.</p>
                        <p class="cn">我们从特殊装置末端收集穿梭每一条铝管的风，从而实现保留最真实、最纯粹的风的音符。</p>
                        <p class="en">The wind shows us its different forms in different times. We want to recover its true sound and present it in music. Dr. Maria Wong, a famous Jazz musician and compsoer, managed to  bring these voice of wind alive. ……</p>
                        <p class="cn">风在不同的时间段表现出不同的生命力。我们要做的，是通过音乐让风声返璞归真。著名爵士音乐家和作曲家王璁博士帮我们实现了这一点，她联合希腊奥运多媒体、灯光总监Etienne Schwarc，通过在600米高空的捕风取样，根据风声在城市中不同时间段的不同特点、按照中国传统的12时辰划分为8段，形成一张独特的风之音乐原声大碟。</p>
                        <p class="en">This is a great attempt for art and technology. We were hoping to recall people’s respect for nature. Instead, a miracle was created. Here is the album, feel free to download and share it. Enjoy~</p>
                        <p class="cn">这是一次新的艺术与科技的尝试，我们希望做一些实实在在的东西，唤起人们对自然的敬畏。而我们也确实实现了这一奇迹。以下是完整的专辑，请随意聆听、下载和分享，尽情地感受自然吧。</p>
                    </section>
                    <video controls
                        crossorigin="anonymous" 
                        poster="${PATH}/poster.jpg"
                        preload="auto">
                    </video>
                </div>
            </div>
            <div class="back">Back</div>
        </div>
    `;
}

(async () => {
    await domReady();

    $video = document.body::$append(template())::$find('#video');
    var $scroll = $video::$find('.scrollWrap');
    var $back = $video::$find('.back');

    $scroll::$on('mousewheel', function(e) {
        var detal = e.wheelDelta;
        $scroll.scrollTop -= detal;
    });

    $back::$on('click', function(e) {
        hide();
    });
})();