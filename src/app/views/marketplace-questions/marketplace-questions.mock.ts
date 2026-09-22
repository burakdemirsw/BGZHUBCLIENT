import {
    CannedAnswer,
    MarketplaceQuestion,
    QuestionPlatform,
    QuestionMessage,
    QuestionProduct,
    QuestionStatus,
} from '@/app/core/models/marketplace-questions/marketplace-questions.models';

/**
 * Soru & Cevap Merkezi için test verileri.
 * API bağlanana kadar sayfa bu verilerle çalışır; tarihler çalışma anına göre üretilir.
 */

const LOGO = 'assets/images/logos/';
const IMG = 'assets/images/products/';

export const MOCK_PLATFORMS: QuestionPlatform[] = [
    { key: 'trendyol', name: 'Trendyol', logo: LOGO + 'trendyol.png' },
    { key: 'hepsiburada', name: 'Hepsiburada', logo: LOGO + 'hepsiburada.jpg' },
    { key: 'amazon', name: 'Amazon', logo: LOGO + 'amazon.svg' },
    { key: 'n11', name: 'N11', logo: LOGO + 'n11.png' },
    { key: 'beymen', name: 'Beymen', logo: LOGO + 'beymen.png' },
    { key: 'boyner', name: 'Boyner', logo: LOGO + 'boyner.png' },
    { key: 'ciceksepeti', name: 'Çiçeksepeti', logo: LOGO + 'ciceksepeti.png' },
];

const PRODUCTS: QuestionProduct[] = [
    { id: 'p1', name: 'Haki Slim Fit Comfort Erkek Pantolon', sku: 'ANT-PNT-1042', barcode: '8690001042321', color: 'Haki', image: IMG + '1.png' },
    { id: 'p2', name: 'Lacivert Toka Detaylı Kadın Takım', sku: 'ANT-TKM-2210', barcode: '8690002210554', color: 'Lacivert', image: IMG + '2.png' },
    { id: 'p3', name: 'Kahve Keten Karışımlı Relaxed Erkek Pantolon', sku: 'ANT-PNT-1188', barcode: '8690001188010', color: 'Kahve', image: IMG + '3.png' },
    { id: 'p4', name: 'Haki Keten Karışımlı Kadın Uzun Yelek', sku: 'ANT-YLK-3301', barcode: '8690003301776', color: 'Haki', image: IMG + '4.png' },
    { id: 'p5', name: 'Lacivert Relaxed Modal Kumaş Erkek Pantolon', sku: 'ANT-PNT-1205', barcode: '8690001205908', color: 'Lacivert', image: IMG + '5.png' },
    { id: 'p6', name: 'Yeşil Kruvaze Kapama Kemerli Trençkot', sku: 'ANT-TRC-4410', barcode: '8690004410213', color: 'Yeşil', image: IMG + '6.png' },
    { id: 'p7', name: 'Siyah Basic Kadın Sweatshirt', sku: 'ANT-SWT-5120', barcode: '8690005120447', color: 'Siyah', image: IMG + '7.png' },
    { id: 'p8', name: 'Ekru Lyocell Karışımlı Yazlık Ceket', sku: 'ANT-CKT-6015', barcode: '8690006015339', color: 'Ekru', image: IMG + '8.png' },
    { id: 'p9', name: 'Püsküllü %100 Süet Loafer', sku: 'ANT-AYK-7002', barcode: '8690007002118', color: 'Taba', image: IMG + '9.png' },
    { id: 'p10', name: 'Koyu Kahve Relax Fit Erkek Trençkot', sku: 'ANT-TRC-4432', barcode: '8690004432661', color: 'Kahverengi', image: IMG + '10.png' },
    { id: 'p11', name: 'Bordo Pileli Relax Fit Erkek Pantolon', sku: 'ANT-PNT-1301', barcode: '8690001301090', color: 'Bordo', image: IMG + '11.png' },
    { id: 'p12', name: 'Ekru Baggy Fit Erkek Jean', sku: 'ANT-JEN-8110', barcode: '8690008110225', color: 'Ekru', image: IMG + '12.png' },
];

interface Seed {
    platform: string;
    product: number | null;
    platformProductName?: string;
    customer: string;
    question: string;
    answer?: string;
    status: QuestionStatus;
    hoursAgo: number;
    /** Soru sorulduktan sonra cevabın kaç dakikada verildiği */
    answeredAfterMin?: number;
    askCount?: number;
    isRead?: boolean;
    followUp?: string;
    score?: number;
}

const SEEDS: Seed[] = [
    { platform: 'trendyol', product: 0, customer: 'Mehmet K.', question: 'Merhaba açık gri 32 beden sipariş verdik bir tık sıktı, 33 beden bol gelir mi? Beden tablosunu paylaşır mısınız?', status: 'waiting', hoursAgo: 2, askCount: 2, isRead: false },
    { platform: 'trendyol', product: 1, customer: 'Ayşe T.', question: 'Alt ve üst kumaş esnek mi?', status: 'waiting', hoursAgo: 5, isRead: false },
    { platform: 'hepsiburada', product: 4, customer: 'Burak Y.', question: '1.83 boy 87 kg ölçü L mi XL mi olmalıdır?', status: 'waiting', hoursAgo: 40, isRead: false },
    { platform: 'amazon', product: 5, customer: 'Selin A.', question: 'Polyester olmayan keten pamuk kumaş türü modelleriniz var mı?', status: 'waiting', hoursAgo: 45, askCount: 3, isRead: true },
    { platform: 'trendyol', product: null, platformProductName: 'Siyah Paça Dantel İşlemeli Kadın Pantolon', customer: 'Zeynep D.', question: '80 kg 160 boy kaç beden almalıyım?', status: 'waiting', hoursAgo: 8, isRead: false },
    { platform: 'n11', product: 7, customer: 'Can Ö.', question: 'Manken boy ve kilosu kaç, üzerindeki beden hangisi?', status: 'waiting', hoursAgo: 12, isRead: true },
    { platform: 'beymen', product: 9, customer: 'Deniz E.', question: 'Az önce L beden vardı, kredi kartından onayladım ama sipariş oluşmamış ve L beden bitmiş görünüyor.', status: 'waiting', hoursAgo: 1, askCount: 2, isRead: false },
    { platform: 'boyner', product: 11, customer: 'Emre S.', question: '186 boy 88 kiloya hangi beden almalıyım?', status: 'waiting', hoursAgo: 20, isRead: true },
    { platform: 'trendyol', product: 8, customer: 'Anonim', question: 'Kanka sipariş için tarayıcıya Tr3endtakipcifavorii yazıp bir göz atın', status: 'expired', hoursAgo: 60, isRead: false },
    { platform: 'hepsiburada', product: null, platformProductName: 'Kahve Suni Deri Bomber Ceket', customer: 'Gökhan B.', question: '1300 TL idi, hatalı geldiği için iade ettim, yeniden verecektim fiyat yükselmiş...', status: 'expired', hoursAgo: 70, isRead: true },
    { platform: 'trendyol', product: 2, customer: 'Oğuz P.', question: 'Bu ürünü sipariş verdim, lütfen bu ürünü yollayın; hemen hemen aynı ilanla bir ürün daha var, karıştırmayınız lütfen.', answer: 'Merhaba Oğuz Bey, siparişinizdeki ürün barkod bazında kontrol edilerek hazırlanmaktadır. Kahve Keten Karışımlı Relaxed modelin gönderileceğinden emin olabilirsiniz. İyi günler dileriz.', status: 'answered', hoursAgo: 30, answeredAfterMin: 42, isRead: true, score: 9 },
    { platform: 'trendyol', product: 3, customer: 'Hande Ç.', question: 'Eteği yok mu, gelmeyecek mi?', answer: 'Merhaba, bu ürün yalnızca yelek olarak satılmaktadır. Aynı kumaştan etek modelimiz mağazamızda ayrıca listelenmektedir.', status: 'answered', hoursAgo: 34, answeredAfterMin: 18, isRead: true, followUp: 'Teşekkürler, eteği de sepete ekledim.', score: 8 },
    { platform: 'hepsiburada', product: 0, customer: 'Serkan L.', question: '178 cm 80 kilo, 32 ve 33 bedenlerin ölçülerini öğrenirsem sevinirim.', answer: 'Merhaba, 32 beden bel 84 cm, 33 beden bel 87 cm ölçüsündedir. Boy ve kilonuza göre 32 beden önerilmektedir.', status: 'answered', hoursAgo: 36, answeredAfterMin: 95, isRead: true, score: 10 },
    { platform: 'amazon', product: 4, customer: 'Kerem N.', question: 'Kumaş içeriğini paylaşabilir misiniz? Yüzde kaç polyester, kaç likra?', answer: 'Merhaba, ürün içeriği %68 Modal, %28 Polyester, %4 Elastandır.', status: 'answered', hoursAgo: 50, answeredAfterMin: 250, isRead: true, score: 7 },
    { platform: 'n11', product: 6, customer: 'Elif G.', question: 'Mankenin üzerindeki beden ne ve şardonlu mu acaba?', answer: 'Merhaba, mankenimiz S beden giymektedir. Ürün içi şardonludur.', status: 'answered', hoursAgo: 26, answeredAfterMin: 12, isRead: true },
    { platform: 'beymen', product: 7, customer: 'Tolga R.', question: '1.75 boy 70 kg hangi beden?', answer: 'Merhaba, boy ve kilonuza göre M beden önerilmektedir.', status: 'answered', hoursAgo: 22, answeredAfterMin: 8, isRead: true, score: 9 },
    { platform: 'boyner', product: 10, customer: 'Murat F.', question: 'Mankenin üstündeki beden kaç?', answer: 'Merhaba, mankenimiz 1.86 boyunda olup 32 beden giymektedir.', status: 'answered', hoursAgo: 48, answeredAfterMin: 35, isRead: true },
    { platform: 'ciceksepeti', product: 5, customer: 'Nazlı K.', question: 'Kumaş türü nedir? Terletir mi, yağmurluk türü mü?', answer: 'Merhaba, ürün su itici gabardin kumaştandır; nefes alan yapısıyla terletmez ancak tam yağmurluk değildir.', status: 'answered', hoursAgo: 55, answeredAfterMin: 180, isRead: true, score: 8 },
    { platform: 'trendyol', product: 11, customer: 'Barış T.', question: 'Salı sabahı yurt dışına çıkacağım, yarın kargoya verme şansınız var mı?', answer: 'Merhaba, saat 14:00\'e kadar verilen siparişler aynı gün kargoya teslim edilmektedir.', status: 'answered', hoursAgo: 44, answeredAfterMin: 22, isRead: true, score: 10 },
    { platform: 'hepsiburada', product: 1, customer: 'Merve Ş.', question: 'Kemeri ayrı satışınız var mı?', answer: 'Merhaba, kemer takım ile birlikte gönderilmekte olup ayrı satışımız bulunmamaktadır.', status: 'answered', hoursAgo: 58, answeredAfterMin: 64, isRead: true },
    { platform: 'amazon', product: 9, customer: 'Ali V.', question: 'Bu ürünün farklı renkleri gelecek mi?', status: 'rejected', hoursAgo: 66, isRead: true },
    { platform: 'trendyol', product: 6, customer: 'Pınar H.', question: 'Siyah rengi tekrar stoklara girecek mi?', answer: 'Merhaba, siyah renk önümüzdeki hafta stoklarımıza eklenecektir. Favorilerinize ekleyerek bildirim alabilirsiniz.', status: 'answered', hoursAgo: 18, answeredAfterMin: 15, isRead: true },
    { platform: 'n11', product: null, platformProductName: 'Mürdüm Puantiyeli Kadın Top', customer: 'Aysel M.', question: 'M bedenin etek uzunluğu kaç?', status: 'waiting', hoursAgo: 30, isRead: false },
    { platform: 'trendyol', product: 7, customer: 'İlker A.', question: 'Ceketin M ve S bedenleri ne kadar uzunlukta?', status: 'waiting', hoursAgo: 46, isRead: true },
    { platform: 'boyner', product: 2, customer: 'Cem Ü.', question: 'Bel lastikli mi, kemer kullanmak gerekir mi?', answer: 'Merhaba, ürünün beli arkadan lastiklidir, kemer kullanmadan rahatlıkla giyilebilir.', status: 'answered', hoursAgo: 64, answeredAfterMin: 300, isRead: true, score: 6 },
    { platform: 'ciceksepeti', product: 8, customer: 'Sevgi O.', question: 'Hediye paketi yapıyor musunuz?', status: 'waiting', hoursAgo: 3, isRead: false },
];

const HOUR = 60 * 60 * 1000;
/** Pazaryerlerinin cevap süresi (saat) */
const SLA_HOURS = 48;

function iso(ms: number): string {
    return new Date(ms).toISOString();
}

export function buildMockQuestions(now = Date.now()): MarketplaceQuestion[] {
    return SEEDS.map((s, i) => {
        const created = now - s.hoursAgo * HOUR;
        const answeredMs = s.answeredAfterMin ? created + s.answeredAfterMin * 60 * 1000 : undefined;
        const messages: QuestionMessage[] = [{ id: `m${i}-1`, from: 'customer', text: s.question, createdDate: iso(created) }];
        if (s.answer && answeredMs) {
            messages.push({ id: `m${i}-2`, from: 'merchant', text: s.answer, createdDate: iso(answeredMs) });
        }
        if (s.followUp && answeredMs) {
            messages.push({ id: `m${i}-3`, from: 'customer', text: s.followUp, createdDate: iso(answeredMs + 2 * HOUR) });
        }
        return {
            id: `q${i + 1}`,
            platformKey: s.platform,
            customerName: s.customer,
            product: s.product === null ? null : PRODUCTS[s.product],
            platformProductName: s.platformProductName ?? PRODUCTS[s.product ?? 0].name,
            status: s.status,
            isRead: s.isRead ?? true,
            askCount: s.askCount ?? 1,
            createdDate: iso(created),
            deadlineDate: iso(created + SLA_HOURS * HOUR),
            answeredDate: answeredMs ? iso(answeredMs) : undefined,
            messages,
            score: s.score,
        };
    });
}

export const MOCK_PRODUCTS = PRODUCTS;

export const MOCK_CANNED_ANSWERS: CannedAnswer[] = [
    { id: 'c1', text: 'Merhaba, ürünümüz standart kalıptadır. Boy ve kilonuzu paylaşırsanız size en uygun bedeni önerebiliriz.' },
    { id: 'c2', text: 'Merhaba, saat 14:00\'e kadar verilen siparişler aynı gün kargoya teslim edilmektedir. İyi alışverişler dileriz.' },
    { id: 'c3', text: 'Merhaba, ürün içeriği ve bakım talimatları ürün açıklamasında yer almaktadır. Başka sorunuz olursa memnuniyetle yardımcı oluruz.' },
];
