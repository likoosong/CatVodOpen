import req from '../../util/req.js';
import { MOBILE_UA } from '../../util/misc.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import dayjs from 'dayjs';

let url = 'https://music.sonyselect.net/';

async function request(reqUrl) {
    const resp = await req.get(reqUrl, {
        headers: {
            'User-Agent': MOBILE_UA,
        },
    });
    return resp.data;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    return {};
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    const extend = inReq.body.filters;
    let page = pg || 1;
    if (page == 0) page = 1;
}

async function detail(inReq, _outResp) {
    const vod_id = inReq.body.id;
    return { vod_id };
}

async function play(inReq, _outResp) {
    const flag = inReq.body.flag;
    const id = inReq.body.id;
    const ids = id.split('*');
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;
    const html = await request(`${url}/index.php/vodsearch/-------------.html?wd=${wd}`);
    const $ = load(html);
    const videos = $('div.module-items > div.module-search-item')
        .map((_, div) => {
            const t = $(div).find('div.video-info-header h3 a')[0];
            return {
                vod_id: t.attribs.href.match(/voddetail\/(.*).html/)[1],
                vod_name: t.attribs.title,
                vod_pic: fixImgUrl($(div).find('div.module-item-pic img')[0].attribs['data-src']),
                vod_remarks: $(div).find('a.video-serial').text(),
            };
        })
        .get();
    return {
        page: page,
        pagecount: videos.length < 10 ? page : page + 1,
        list: videos,
    };
}

async function test(inReq, outResp) {
    try {
        const printErr = function (json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr(resp.json());
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    for (const vod of dataResult.detail.list) {
                        const flags = vod.vod_play_from.split('$$$');
                        const ids = vod.vod_play_url.split('$$$');
                        for (let j = 0; j < flags.length; j++) {
                            const flag = flags[j];
                            const urls = ids[j].split('#');
                            for (let i = 0; i < urls.length && i < 2; i++) {
                                resp = await inReq.server
                                    .inject()
                                    .post(`${prefix}/play`)
                                    .payload({
                                        flag: flag,
                                        id: urls[i].split('$')[1],
                                    });
                                dataResult.play.push(resp.json());
                            }
                        }
                    }
                }
            }
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '乐',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'smusic',
        name: '索尼音乐',
        type: 39,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};
