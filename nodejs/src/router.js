//豆瓣索引
import douban from './spider/video/douban.js';
//App及网站资源
import kunyu77 from './spider/video/kunyu77.js';
import kkys from './spider/video/kkys.js';
import push from './spider/video/push.js';
import wogg from './spider/video/wogg.js';
import tudou from './spider/video/tudou.js';
import wobg from './spider/video/wobg.js';
import nangua from './spider/video/nangua.js';
//网盘alist
import alist from './spider/pan/alist.js';
//采集源
import ffm3u8 from './spider/video/ffm3u8.js';
import hhm3u8 from './spider/video/hhm3u8.js';
import lzm3u8 from './spider/video/lzm3u8.js';
//import jojo from './spider/video/jojo.js';
//漫画听书
import _13bqg from './spider/book/13bqg.js';
import copymanga from './spider/book/copymanga.js';
import laobaigs from './spider/book/laobaigs.js';
import baozi from './spider/book/baozi.js';
import wenku from './spider/book/wenku.js';
import coco from './spider/book/coco.js';

const spiders = [douban, kunyu77, kkys, ffm3u8, push, alist, _13bqg, copymanga, wogg, tudou, wobg, hhm3u8, lzm3u8, laobaigs, baozi, wenku, coco, nangua];
const spiderPrefix = '/spider';

/**
 * A function to initialize the router.
 *
 * @param {Object} fastify - The Fastify instance
 * @return {Promise<void>} - A Promise that resolves when the router is initialized
 */
export default async function router(fastify) {
    // register all spider router
    spiders.forEach((spider) => {
        const path = spiderPrefix + '/' + spider.meta.key + '/' + spider.meta.type;
        fastify.register(spider.api, { prefix: path });
        console.log('Register spider: ' + path);
    });
    /**
     * @api {get} /check 检查
     */
    fastify.register(
        /**
         *
         * @param {import('fastify').FastifyInstance} fastify
         */
        async (fastify) => {
            fastify.get(
                '/check',
                /**
                 * check api alive or not
                 * @param {import('fastify').FastifyRequest} _request
                 * @param {import('fastify').FastifyReply} reply
                 */
                async function (_request, reply) {
                    reply.send({ run: !fastify.stop });
                }
            );
            fastify.get(
                '/config',
                /**
                 * get catopen format config
                 * @param {import('fastify').FastifyRequest} _request
                 * @param {import('fastify').FastifyReply} reply
                 */
                async function (_request, reply) {
                    const config = {
                        video: {
                            sites: [],
                        },
                        read: {
                            sites: [],
                        },
                        comic: {
                            sites: [],
                        },
                        music: {
                            sites: [],
                        },
                        pan: {
                            sites: [],
                        },
                        color: fastify.config.color || [],
                    };
                    spiders.forEach((spider) => {
                        let meta = Object.assign({}, spider.meta);
                        meta.api = spiderPrefix + '/' + meta.key + '/' + meta.type;
                        meta.key = 'nodejs_' + meta.key;
                        const stype = spider.meta.type;
                        if (stype < 10) {
                            config.video.sites.push(meta);
                        } else if (stype >= 10 && stype < 20) {
                            config.read.sites.push(meta);
                        } else if (stype >= 20 && stype < 30) {
                            config.comic.sites.push(meta);
                        } else if (stype >= 30 && stype < 40) {
                            config.music.sites.push(meta);
                        } else if (stype >= 40 && stype < 50) {
                            config.pan.sites.push(meta);
                        }
                    });
                    reply.send(config);
                }
            );
        }
    );
}
