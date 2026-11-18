/*
 * KPSS Oyun — İçerik Bankası
 *
 * Her ünite şu alanları içerebilir:
 *  mc    : Çoktan seçmeli  -> [soru, [şıklar], doğruŞıkIndex, açıklama]
 *  tf    : Doğru/Yanlış     -> [ifade, true|false, açıklama]
 *  pairs : Eşleştirme       -> [sol, sağ]
 *  order : Kronoloji setleri-> { prompt, items: [[olay, tarih], ...] }  (doğru sırada yazılır)
 *  gen   : Soru üreteci (matematik gibi sonsuz soru üretilebilen üniteler için)
 *
 * Yeni soru eklemek için ilgili diziye satır eklemen yeterli.
 */

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };

// Doğru cevabın etrafında yanıltıcı sayısal şıklar üretir
function numOpts(ans, spread) {
  const set = new Set([ans]);
  let guard = 0;
  while (set.size < 4 && guard++ < 200) {
    const d = R(-spread, spread);
    const v = ans + d;
    if (d !== 0 && v > 0) set.add(v);
  }
  let k = 1;
  while (set.size < 4) set.add(ans + spread + k++);
  return shuf([...set].map(String));
}
const mcq = (q, ans, spread, ex) => ({ type: "mc", q, opts: numOpts(ans, spread), a: String(ans), ex });

window.SUBJECTS = [
  /* ============================ TARİH ============================ */
  {
    id: "tarih", name: "Tarih", world: "Zaman Kalesi", icon: "🏛️", color: "#e67e22",
    units: [
      {
        id: "t1", title: "İslamiyet Öncesi Türk Tarihi",
        mc: [
          ["Tarihte bilinen ilk Türk devleti hangisidir?", ["Asya Hun Devleti", "Göktürk Devleti", "Uygur Devleti", "Avar Devleti"], 0, "Bilinen ilk Türk devleti Asya (Büyük) Hun Devleti'dir. En parlak dönemini Mete Han zamanında yaşamıştır."],
          ["“Türk” adını resmi devlet adı olarak kullanan ilk Türk devleti hangisidir?", ["Asya Hunları", "Göktürkler", "Uygurlar", "Hazarlar"], 1, "Göktürkler, “Türk” adını devlet adı olarak kullanan ilk Türk devletidir."],
          ["Yerleşik hayata geçen ilk Türk devleti hangisidir?", ["Göktürkler", "Kırgızlar", "Uygurlar", "Avarlar"], 2, "Uygurlar, Bögü Kağan döneminde Maniheizm'i benimseyerek yerleşik hayata geçmiştir."],
          ["Orduda onlu sistemi (askeri teşkilat) kuran Türk hükümdarı kimdir?", ["Bumin Kağan", "Mete Han", "Attila", "Bilge Kağan"], 1, "Mete Han, MÖ 209'da ordusunu onlu sisteme göre teşkilatlandırmıştır. Bu sistem bugün de kullanılır."],
          ["Orhun (Göktürk) Yazıtları hangi dönemde dikilmiştir?", ["I. Göktürk Devleti", "II. Göktürk (Kutluk) Devleti", "Uygur Devleti", "Asya Hun Devleti"], 1, "Tonyukuk, Kül Tigin ve Bilge Kağan yazıtları II. Göktürk (Kutluk) Devleti döneminde dikilmiştir."],
          ["751 Talas Savaşı'nın en önemli sonucu nedir?", ["Türklerin Anadolu'ya girmesi", "Türklerin İslamiyet'e geçişinin hızlanması", "Kavimler Göçü'nün başlaması", "Göktürklerin yıkılması"], 1, "Talas'ta Türkler Abbasilerle birlikte Çin'e karşı savaştı; bu, Türklerin İslamiyet'e geçişini hızlandırdı."],
          ["375'te Kavimler Göçü'nü başlatan Türk topluluğu hangisidir?", ["Avrupa Hunları", "Peçenekler", "Kumanlar", "Bulgarlar"], 0, "Balamir önderliğindeki Avrupa Hunları'nın batıya ilerlemesi Kavimler Göçü'nü başlatmıştır."],
          ["Eski Türklerde devlet işlerinin görüşüldüğü meclisin adı nedir?", ["Divan", "Kurultay", "Meclis-i Mebusan", "Ayan"], 1, "Kurultay (toy), devlet meselelerinin görüşüldüğü danışma meclisidir."]
        ],
        tf: [
          ["Attila, Asya Hun Devleti'nin hükümdarıdır.", false, "Attila, Avrupa Hun Devleti'nin hükümdarıdır."],
          ["Kut anlayışına göre yönetme yetkisi Tanrı tarafından verilir.", true, "Eski Türklerde hükümdarlık yetkisinin (kut) Tanrı tarafından verildiğine inanılırdı."],
          ["Uygurlar Maniheizm dinini benimsemiştir.", true, "Bögü Kağan döneminde Uygurlar Maniheizm'i benimsemiştir."],
          ["Talas Savaşı 1071 yılında yapılmıştır.", false, "Talas Savaşı 751'de yapılmıştır. 1071 Malazgirt Savaşı'nın tarihidir."],
          ["Göktürk alfabesi 38 harften oluşur.", true, "Göktürk (Orhun) alfabesi 38 harflidir."],
          ["Kurultay, eski Türklerde danışma meclisidir.", true, "Kurultay'da devlet işleri görüşülür, kararlar alınırdı."],
          ["Bumin Kağan, Uygur Devleti'nin kurucusudur.", false, "Bumin Kağan, 552'de I. Göktürk Devleti'ni kurmuştur."],
          ["Kavimler Göçü 375 yılında başlamıştır.", true, "Avrupa Hunlarının batıya ilerlemesiyle 375'te başlamıştır."]
        ],
        pairs: [
          ["Mete Han", "Asya Hun Devleti"], ["Attila", "Avrupa Hun Devleti"], ["Bumin Kağan", "I. Göktürk Devleti"],
          ["Bilge Kağan", "II. Göktürk Devleti"], ["Bögü Kağan", "Uygurlar - Maniheizm"], ["Kurultay", "Danışma meclisi"]
        ],
        order: [
          { prompt: "Olayları eskiden yeniye sırala", items: [["Asya Hun Devleti'nin kuruluşu", "MÖ 220"], ["Kavimler Göçü", "375"], ["I. Göktürk Devleti'nin kuruluşu", "552"], ["Talas Savaşı", "751"]] }
        ]
      },
      {
        id: "t2", title: "Osmanlı Kuruluş ve Yükselme",
        mc: [
          ["İstanbul hangi yıl fethedilmiştir?", ["1402", "1453", "1517", "1526"], 1, "İstanbul, 29 Mayıs 1453'te II. Mehmet (Fatih) tarafından fethedildi."],
          ["Osmanlı'da ilk düzenli ordu (Yaya ve Müsellem) hangi padişah döneminde kuruldu?", ["Osman Bey", "Orhan Bey", "I. Murat", "Yıldırım Bayezid"], 1, "İlk düzenli ordu Orhan Bey döneminde kuruldu; ilk Osmanlı parası da bu dönemde basıldı."],
          ["Fetret Devri'ne yol açan savaş hangisidir?", ["Kosova Savaşı", "Niğbolu Savaşı", "Ankara Savaşı", "Varna Savaşı"], 2, "1402 Ankara Savaşı'nda Yıldırım Bayezid, Timur'a yenildi ve Fetret Devri başladı."],
          ["Halifeliğin Osmanlılara geçmesini sağlayan sefer hangisidir?", ["Mısır Seferi", "İran Seferi", "Belgrad Seferi", "Rodos Seferi"], 0, "Yavuz Sultan Selim'in Mısır Seferi (Ridaniye 1517) sonrası halifelik Osmanlılara geçti."],
          ["Preveze Deniz Savaşı'nda Osmanlı donanmasının komutanı kimdir?", ["Piri Reis", "Turgut Reis", "Barbaros Hayreddin Paşa", "Kılıç Ali Paşa"], 2, "1538 Preveze'de Barbaros Hayreddin Paşa, Haçlı donanmasını yendi; Akdeniz Türk gölü hâline geldi."],
          ["Devşirme sistemi ilk kez hangi padişah döneminde uygulanmıştır?", ["Orhan Bey", "I. Murat", "II. Murat", "Fatih Sultan Mehmet"], 1, "Devşirme sistemi ve Pençik Kanunu I. Murat döneminde uygulamaya konmuştur."],
          ["Mohaç Meydan Muharebesi (1526) hangi padişah döneminde yapılmıştır?", ["Yavuz Sultan Selim", "II. Bayezid", "Kanuni Sultan Süleyman", "II. Selim"], 2, "Kanuni döneminde Macaristan'a karşı kazanılan Mohaç, tarihin en kısa meydan muharebelerindendir."],
          ["Çaldıran Savaşı (1514) hangi devlete karşı yapılmıştır?", ["Memlükler", "Safeviler", "Akkoyunlular", "Venedik"], 1, "Çaldıran'da Yavuz Sultan Selim, Safevi hükümdarı Şah İsmail'i yendi."]
        ],
        tf: [
          ["I. Kosova Savaşı (1389) I. Murat döneminde yapılmıştır.", true, "I. Kosova Savaşı 1389'da I. Murat döneminde yapıldı; I. Murat savaş alanında şehit oldu."],
          ["Çaldıran Savaşı Memlüklere karşı yapılmıştır.", false, "Çaldıran (1514) Safevilere karşıdır. Memlüklere karşı Mercidabık (1516) ve Ridaniye (1517) yapılmıştır."],
          ["Bursa, Orhan Bey döneminde alınmıştır.", true, "Bursa 1326'da alındı ve başkent yapıldı."],
          ["Fetret Devri, Ankara Savaşı'ndan sonra başlamıştır.", true, "1402 Ankara Savaşı'ndan sonra şehzadeler arası taht mücadelesi (Fetret Devri) başladı."],
          ["Mercidabık Savaşı Safevilere karşı yapılmıştır.", false, "Mercidabık (1516) Memlüklere karşı yapılmıştır."],
          ["İstanbul'un fethiyle Orta Çağ'ın sona erdiği kabul edilir.", true, "1453'te İstanbul'un fethi, genel kabule göre Orta Çağ'ı kapatıp Yeni Çağ'ı başlatmıştır."],
          ["Preveze Deniz Savaşı 1571'de yapılmıştır.", false, "Preveze 1538'dedir. 1571, İnebahtı yenilgisinin tarihidir."],
          ["İlk Osmanlı parası Orhan Bey döneminde basılmıştır.", true, "Orhan Bey döneminde ilk gümüş Osmanlı parası (akçe) basıldı."]
        ],
        pairs: [
          ["1402", "Ankara Savaşı"], ["1453", "İstanbul'un Fethi"], ["1514", "Çaldıran Savaşı"],
          ["1516", "Mercidabık Savaşı"], ["1526", "Mohaç Muharebesi"], ["1538", "Preveze Deniz Savaşı"]
        ],
        order: [
          { prompt: "Olayları eskiden yeniye sırala", items: [["Bursa'nın alınması", "1326"], ["I. Kosova Savaşı", "1389"], ["Ankara Savaşı", "1402"], ["İstanbul'un Fethi", "1453"], ["Çaldıran Savaşı", "1514"], ["Mohaç Muharebesi", "1526"]] }
        ]
      }
    ]
  },

  /* ============================ COĞRAFYA ============================ */
  {
    id: "cografya", name: "Coğrafya", world: "Anadolu Haritası", icon: "🗺️", color: "#27ae60",
    units: [
      {
        id: "c1", title: "Türkiye'nin Konumu ve Fiziki Özellikleri",
        mc: [
          ["Türkiye'nin en yüksek dağı hangisidir?", ["Erciyes", "Ağrı Dağı", "Süphan", "Uludağ"], 1, "Ağrı Dağı (5137 m), Türkiye'nin en yüksek dağıdır."],
          ["Türkiye'nin yüzölçümü en büyük gölü hangisidir?", ["Tuz Gölü", "Beyşehir Gölü", "Van Gölü", "Eğirdir Gölü"], 2, "Van Gölü, Türkiye'nin en büyük gölüdür ve sodalı (acı) bir göldür."],
          ["Tamamı Türkiye sınırları içinde olan en uzun akarsu hangisidir?", ["Fırat", "Sakarya", "Kızılırmak", "Yeşilırmak"], 2, "Kızılırmak (yaklaşık 1355 km) Türkiye'de doğup Türkiye'de denize dökülen en uzun akarsudur."],
          ["Türkiye'nin en doğu ve en batı uçları arasındaki yerel saat farkı yaklaşık kaç dakikadır?", ["60", "76", "84", "96"], 1, "Türkiye 26°-45° Doğu boylamları arasındadır: 19 boylam × 4 dk = 76 dakika."],
          ["Türkiye'de en fazla yağış alan il hangisidir?", ["Trabzon", "Artvin", "Rize", "Giresun"], 2, "Rize, Karadeniz'in nemli hava kütlelerinin dağlara çarpmasıyla (orografik) en çok yağış alan ildir."],
          ["Yüzölçümü en büyük ilimiz hangisidir?", ["Ankara", "Sivas", "Erzurum", "Konya"], 3, "Konya, yüzölçümü bakımından Türkiye'nin en büyük ilidir."],
          ["Akdeniz ikliminin doğal bitki örtüsü hangisidir?", ["Bozkır", "Maki", "Orman (geniş yapraklı)", "Çayır"], 1, "Akdeniz ikliminin doğal bitki örtüsü makidir. Maki tahrip edilince garig oluşur."],
          ["Türkiye hangi enlemler arasında yer alır?", ["26°-45° Kuzey", "36°-42° Kuzey", "36°-42° Güney", "30°-40° Kuzey"], 1, "Türkiye 36°-42° Kuzey enlemleri ile 26°-45° Doğu boylamları arasındadır."]
        ],
        tf: [
          ["Türkiye Kuzey Yarım Küre'de yer alır.", true, "Türkiye 36°-42° Kuzey enlemleri arasındadır."],
          ["Tuz Gölü Ege Bölgesi'ndedir.", false, "Tuz Gölü İç Anadolu Bölgesi'ndedir."],
          ["Akdeniz ikliminde yazlar sıcak ve kurak, kışlar ılık ve yağışlıdır.", true, "Bu, Akdeniz ikliminin temel özelliğidir."],
          ["Karadeniz kıyılarının doğal bitki örtüsü makidir.", false, "Karadeniz kıyılarında doğal bitki örtüsü ormandır; maki Akdeniz iklimine aittir."],
          ["Türkiye'de güneyden kuzeye gidildikçe ortalama sıcaklık genel olarak azalır.", true, "Kuzey Yarım Küre'de ekvatordan uzaklaştıkça güneş ışınlarının geliş açısı küçülür."],
          ["Van Gölü bir tatlı su gölüdür.", false, "Van Gölü sodalı (acı) bir göldür."],
          ["Türkiye'nin en doğusundaki il Iğdır'dır.", true, "En doğu nokta Iğdır'ın Dilucu mevkisidir."],
          ["Türkiye'de tek bir saat dilimi (UTC+3) kullanılır.", true, "Türkiye 2016'dan beri yıl boyunca UTC+3 saatini kullanır."]
        ],
        pairs: [
          ["Ağrı Dağı", "En yüksek dağ"], ["Van Gölü", "En büyük göl"], ["Kızılırmak", "En uzun akarsu"],
          ["Rize", "En çok yağış alan il"], ["Konya", "Yüzölçümü en büyük il"], ["Maki", "Akdeniz bitki örtüsü"]
        ]
      },
      {
        id: "c2", title: "Türkiye Ekonomisi ve Üretim",
        mc: [
          ["Türkiye'de çay tarımı en çok hangi ilde yapılır?", ["Ordu", "Rize", "Samsun", "Sinop"], 1, "Çay, bol ve her mevsim yağış isteyen bir bitkidir; en çok Rize'de yetişir."],
          ["Taşkömürü en çok hangi ilimizde çıkarılır?", ["Zonguldak", "Kahramanmaraş", "Manisa", "Kütahya"], 0, "Türkiye'nin taşkömürü havzası Zonguldak çevresidir."],
          ["Türkiye dünyada en büyük rezervine hangi madende sahiptir?", ["Demir", "Krom", "Bor", "Bakır"], 2, "Türkiye, dünya bor rezervlerinin büyük bölümüne sahiptir."],
          ["GAP (Güneydoğu Anadolu Projesi) hangi akarsuların havzasını kapsar?", ["Kızılırmak - Yeşilırmak", "Fırat - Dicle", "Seyhan - Ceyhan", "Sakarya - Porsuk"], 1, "GAP, Fırat ve Dicle havzalarında sulama ve enerji üretimini amaçlar."],
          ["Lületaşı ile ünlü ilimiz hangisidir?", ["Eskişehir", "Nevşehir", "Afyonkarahisar", "Kütahya"], 0, "Lületaşı Eskişehir'e özgü bir mineraldir."],
          ["Fındık üretiminde ilk sırada yer alan bölge hangisidir?", ["Marmara", "Ege", "Karadeniz", "Akdeniz"], 2, "Fındık en çok Karadeniz'de (özellikle Ordu ve Giresun) yetişir."],
          ["Türkiye'nin en büyük linyit rezervi nerededir?", ["Soma", "Afşin-Elbistan", "Tunçbilek", "Zonguldak"], 1, "En büyük linyit rezervi Kahramanmaraş Afşin-Elbistan'dadır."],
          ["Zeytin üretiminin en fazla olduğu bölge hangisidir?", ["Ege", "Karadeniz", "İç Anadolu", "Doğu Anadolu"], 0, "Zeytin, Akdeniz iklimi bitkisidir ve en çok Ege'de üretilir."]
        ],
        tf: [
          ["Taşkömürü en çok Zonguldak çevresinde çıkarılır.", true, "Zonguldak Türkiye'nin taşkömürü havzasıdır."],
          ["Haşhaş üretimi en çok Karadeniz Bölgesi'nde yapılır.", false, "Haşhaş en çok Afyonkarahisar ve çevresinde üretilir."],
          ["GAP, Fırat ve Dicle havzalarını kapsar.", true, "GAP bu iki akarsuyun havzasındaki kalkınma projesidir."],
          ["Çay tarımı en çok İç Anadolu'da yapılır.", false, "Çay bol yağış ister; en çok Doğu Karadeniz'de (Rize) yetişir."],
          ["Türkiye bor rezervlerinde dünyada ilk sıradadır.", true, "Dünya bor rezervlerinin en büyük kısmı Türkiye'dedir."],
          ["Zeytin en çok Ege Bölgesi'nde üretilir.", true, "Ege, zeytin ve zeytinyağı üretiminde birinci sıradadır."],
          ["Pamuk üretiminde Şanlıurfa önemli bir yere sahiptir.", true, "GAP sulamalarıyla Şanlıurfa (Harran Ovası) pamuk üretiminde öne çıkmıştır."],
          ["Lületaşı en çok Rize'de çıkarılır.", false, "Lületaşı Eskişehir'e özgüdür."]
        ],
        pairs: [
          ["Rize", "Çay"], ["Ordu", "Fındık"], ["Zonguldak", "Taşkömürü"],
          ["Afyonkarahisar", "Haşhaş"], ["Şanlıurfa", "Pamuk"], ["Eskişehir", "Lületaşı"]
        ]
      }
    ]
  },

  /* ============================ VATANDAŞLIK ============================ */
  {
    id: "vatandaslik", name: "Vatandaşlık", world: "Anayasa Sarayı", icon: "⚖️", color: "#8e44ad",
    units: [
      {
        id: "v1", title: "Anayasa ve Devlet Yapısı",
        mc: [
          ["TBMM kaç milletvekilinden oluşur?", ["450", "550", "600", "650"], 2, "2017 değişikliğiyle milletvekili sayısı 600'e çıkarıldı."],
          ["Milletvekili seçilme yaşı kaçtır?", ["18", "21", "25", "30"], 0, "2017 değişikliğiyle milletvekili seçilme yaşı 18'e indirildi."],
          ["Cumhurbaşkanının görev süresi kaç yıldır?", ["4", "5", "6", "7"], 1, "Cumhurbaşkanı 5 yıl için seçilir; bir kişi en fazla iki defa seçilebilir."],
          ["Anayasa Mahkemesi kaç üyeden oluşur?", ["11", "13", "15", "17"], 2, "Anayasa Mahkemesi 15 üyeden oluşur."],
          ["Osmanlı'nın ilk anayasası hangisidir?", ["Sened-i İttifak", "Kanun-i Esasi", "Tanzimat Fermanı", "Islahat Fermanı"], 1, "1876 Kanun-i Esasi, ilk Osmanlı (ve Türk) anayasasıdır."],
          ["1982 Anayasası'na göre değiştirilmesi teklif dahi edilemeyen maddeler hangileridir?", ["İlk 3 madde", "İlk 5 madde", "Başlangıç ve 10. madde", "Sadece 1. madde"], 0, "Anayasa'nın 4. maddesi, ilk 3 maddenin değiştirilemeyeceğini ve değiştirilmesinin teklif edilemeyeceğini belirtir."],
          ["Yasama yetkisi kime aittir?", ["Cumhurbaşkanı", "Bakanlar", "TBMM", "Anayasa Mahkemesi"], 2, "Yasama yetkisi Türk Milleti adına TBMM'nindir ve bu yetki devredilemez."],
          ["Türkiye'de kadınlara milletvekili seçme ve seçilme hakkı hangi yıl verilmiştir?", ["1923", "1930", "1934", "1946"], 2, "1930'da belediye, 1933'te muhtarlık, 1934'te milletvekili seçme-seçilme hakkı verildi."]
        ],
        tf: [
          ["1921 Anayasası'nın adı Teşkilat-ı Esasiye Kanunu'dur.", true, "1921 Teşkilat-ı Esasiye Kanunu, Kurtuluş Savaşı döneminde kabul edildi."],
          ["Yasama yetkisi Cumhurbaşkanı'na aittir.", false, "Yasama yetkisi TBMM'ye aittir; yürütme yetkisi Cumhurbaşkanı'ndadır."],
          ["Cumhurbaşkanı adayı olabilmek için 40 yaşını doldurmuş olmak gerekir.", true, "Ayrıca yükseköğrenim yapmış ve milletvekili seçilme yeterliliğine sahip olmak gerekir."],
          ["Anayasa Mahkemesi 11 üyeden oluşur.", false, "Anayasa Mahkemesi 15 üyeden oluşur."],
          ["1982 Anayasası halkoylamasıyla kabul edilmiştir.", true, "1982 Anayasası 7 Kasım 1982'de halkoylamasıyla kabul edildi."],
          ["TBMM seçimleri 5 yılda bir yapılır.", true, "2017 değişikliğiyle TBMM ve Cumhurbaşkanlığı seçimleri 5 yılda bir aynı gün yapılır."],
          ["Anayasa Mahkemesi ilk kez 1924 Anayasası ile kurulmuştur.", false, "Anayasa Mahkemesi 1961 Anayasası ile kurulmuştur."],
          ["Yargı yetkisi bağımsız ve tarafsız mahkemelerce kullanılır.", true, "Anayasa'nın 9. maddesi bunu düzenler."]
        ],
        pairs: [
          ["1876", "Kanun-i Esasi"], ["1921", "Teşkilat-ı Esasiye Kanunu"], ["1924", "Cumhuriyetin ilk anayasası"],
          ["1961", "Anayasa Mahkemesi'nin kuruluşu"], ["1982", "Yürürlükteki anayasa"], ["2017", "Cumhurbaşkanlığı Hükümet Sistemi"]
        ],
        order: [
          { prompt: "Anayasaları eskiden yeniye sırala", items: [["Kanun-i Esasi", "1876"], ["Teşkilat-ı Esasiye Kanunu", "1921"], ["1924 Anayasası", "1924"], ["1961 Anayasası", "1961"], ["1982 Anayasası", "1982"]] }
        ]
      },
      {
        id: "v2", title: "Temel Hukuk Kavramları",
        mc: [
          ["Normlar hiyerarşisinde en üstte hangisi yer alır?", ["Kanun", "Yönetmelik", "Anayasa", "Cumhurbaşkanlığı kararnamesi"], 2, "Anayasa, normlar hiyerarşisinin en üstündedir; hiçbir hukuk kuralı Anayasa'ya aykırı olamaz."],
          ["Türk Medeni Kanunu'na göre ergin olma yaşı kaçtır?", ["15", "17", "18", "21"], 2, "Ergin olma yaşı 18'dir. Evlenme ve mahkeme kararı da kişiyi ergin kılar."],
          ["Aşağıdakilerden hangisi hukukun yazılı olmayan kaynağıdır?", ["Kanun", "Tüzük", "Örf ve adet", "Yönetmelik"], 2, "Örf ve adet hukuku, hukukun yazısız asli kaynağıdır."],
          ["Ceza hukuku hangi hukuk dalındadır?", ["Özel hukuk", "Kamu hukuku", "Karma hukuk", "Ticaret hukuku"], 1, "Ceza hukuku, devlet ile birey ilişkisini düzenlediği için kamu hukuku dalıdır."],
          ["Haklara ve borçlara sahip olabilme yeteneğine ne denir?", ["Fiil ehliyeti", "Hak ehliyeti", "Ayırt etme gücü", "Kısıtlılık"], 1, "Hak ehliyeti her insana tanınır ve tam-sağ doğumla başlar."],
          ["Kişiliğin başlangıcı için gereken şart nedir?", ["Nüfusa kayıt", "Tam ve sağ doğmak", "Ad konulması", "Ergin olmak"], 1, "Kişilik, çocuğun sağ olarak tamamıyla doğduğu anda başlar (ana rahmine düştüğü andan itibaren sağ doğmak şartıyla hak ehliyetine sahiptir)."],
          ["Mahkeme kararıyla ergin kılınabilmek için en az kaç yaşını doldurmak gerekir?", ["14", "15", "16", "17"], 1, "15 yaşını dolduran küçük, kendi isteği ve velisinin rızasıyla mahkeme kararıyla ergin kılınabilir."],
          ["Medeni hukuk hangi hukuk dalına girer?", ["Kamu hukuku", "Özel hukuk", "Uluslararası hukuk", "İdare hukuku"], 1, "Medeni hukuk, kişiler arası ilişkileri düzenleyen özel hukuk dalıdır."]
        ],
        tf: [
          ["Hak ehliyeti tüm insanlara tanınmıştır.", true, "Her insanın hak ehliyeti vardır; bu bakımdan herkes eşittir."],
          ["Ceza hukuku bir özel hukuk dalıdır.", false, "Ceza hukuku kamu hukuku dalıdır."],
          ["Evlenme kişiyi ergin kılar.", true, "Evlenme ile kişi 18 yaşını doldurmamış olsa da ergin olur."],
          ["Kanunları Cumhurbaşkanı yapar.", false, "Kanun koyma yetkisi TBMM'ye aittir."],
          ["Örf ve adet hukukun yazısız kaynaklarındandır.", true, "Örf ve adet hukuku yazısız asli kaynaktır."],
          ["Fiil ehliyeti için ayırt etme gücüne sahip olmak gerekir.", true, "Fiil ehliyeti için ayırt etme gücü, erginlik ve kısıtlı olmamak gerekir."],
          ["Yönetmelikler kanunlara aykırı olabilir.", false, "Normlar hiyerarşisine göre alt norm üst norma aykırı olamaz."],
          ["Yerleşim yeri (ikametgâh) bir kişinin sürekli kalma niyetiyle oturduğu yerdir.", true, "TMK'ya göre yerleşim yeri, kişinin sürekli kalma niyetiyle oturduğu yerdir."]
        ],
        pairs: [
          ["Anayasa", "Normlar hiyerarşisinin en üstü"], ["Hak ehliyeti", "Haklara sahip olabilme"], ["Fiil ehliyeti", "Kendi işlemleriyle hak edinebilme"],
          ["Yerleşim yeri", "İkametgâh"], ["Ceza hukuku", "Kamu hukuku"], ["Medeni hukuk", "Özel hukuk"]
        ]
      }
    ]
  },

  /* ============================ TÜRKÇE ============================ */
  {
    id: "turkce", name: "Türkçe", world: "Kelime Ormanı", icon: "📖", color: "#2980b9",
    units: [
      {
        id: "tr1", title: "Yazım Kuralları",
        mc: [
          ["Hangisinin yazımı doğrudur?", ["Herkez", "Herkes", "Herkeş", "Herkas"], 1, "Doğru yazım “herkes”tir."],
          ["Hangisinin yazımı doğrudur?", ["Yanlız", "Yalnız", "Yalınız", "Yanız"], 1, "Doğru yazım “yalnız”dır (yalın kökünden)."],
          ["Hangisinin yazımı doğrudur?", ["Orjinal", "Orijinal", "Orijinel", "Orjinel"], 1, "Doğru yazım “orijinal”dir."],
          ["Hangisinin yazımı doğrudur?", ["Şöför", "Şoför", "Şöfor", "Şofor"], 1, "Doğru yazım “şoför”dür."],
          ["Hangisinin yazımı doğrudur?", ["Egsoz", "Eksoz", "Egzoz", "Egzos"], 2, "Doğru yazım “egzoz”dur."],
          ["Hangi cümlede “de” bağlacının yazımı yanlıştır?", ["Sen de gel.", "Ben de biliyorum.", "Evde kimse yok.", "Okulda gördüm onuda."], 3, "Bağlaç olan “de/da” her zaman ayrı yazılır: “onu da”."],
          ["Hangisinde soru eki doğru yazılmıştır?", ["Geldinmi?", "Geldin mi?", "Geldin-mi?", "Geldinmı?"], 1, "Soru eki “mı, mi, mu, mü” her zaman ayrı yazılır ve önceki sözcüğe göre ünlü uyumuna girer."],
          ["Hangisinin yazımı doğrudur?", ["Klavuz", "Kılavuz", "Kulavuz", "Kılağuz"], 1, "Doğru yazım “kılavuz”dur."]
        ],
        tf: [
          ["Soru eki “mi” her zaman ayrı yazılır.", true, "Soru eki kendinden önceki sözcükten ayrı yazılır: “Geldin mi?”"],
          ["“Herkez” sözcüğünün yazımı doğrudur.", false, "Doğrusu “herkes”tir."],
          ["Bağlaç olan “de” ayrı yazılır.", true, "Bağlaç olan “de/da” ayrı yazılır; bulunma eki olan “-de/-da” bitişik yazılır."],
          ["“Yanlız” yazımı doğrudur.", false, "Doğrusu “yalnız”dır."],
          ["Özel adlara getirilen çekim ekleri kesme işaretiyle ayrılır.", true, "Örnek: Ankara'ya, Ayşe'nin."],
          ["Belirli bir tarih bildiren ay ve gün adları büyük harfle başlar.", true, "Örnek: 29 Ekim 1923 Pazartesi."],
          ["“Makina” yazımı doğrudur.", false, "TDK'ye göre doğru yazım “makine”dir."],
          ["İlgi eki olan “-ki” bitişik yazılır.", true, "Örnek: evdeki, yarınki, seninki."]
        ],
        pairs: [
          ["Yanlız", "Yalnız"], ["Herkez", "Herkes"], ["Orjinal", "Orijinal"],
          ["Şöför", "Şoför"], ["Egsoz", "Egzoz"], ["Klavuz", "Kılavuz"]
        ]
      },
      {
        id: "tr2", title: "Ses Bilgisi",
        mc: [
          ["“Kitap + ı → kitabı” sözcüğünde hangi ses olayı vardır?", ["Ünlü düşmesi", "Ünsüz yumuşaması", "Ünsüz benzeşmesi", "Ünlü daralması"], 1, "p, ç, t, k ile biten sözcükler ünlüyle başlayan ek alınca b, c, d, g/ğ olur: kitap → kitabı."],
          ["“Ağız + ı → ağzı” sözcüğünde hangi ses olayı vardır?", ["Ünlü düşmesi", "Ünsüz türemesi", "Ünlü daralması", "Kaynaştırma"], 0, "İkinci hecesinde dar ünlü bulunan bazı sözcükler ünlüyle başlayan ek alınca bu ünlü düşer."],
          ["“Başla + yor → başlıyor” sözcüğünde hangi ses olayı vardır?", ["Ünlü düşmesi", "Ünlü daralması", "Ünsüz benzeşmesi", "Ünsüz düşmesi"], 1, "-yor eki, “a, e” ile biten fiillere gelince bu ünlüler daralır (ı, i, u, ü)."],
          ["“Sınıf + da → sınıfta” sözcüğünde hangi ses olayı vardır?", ["Ünsüz yumuşaması", "Ünsüz benzeşmesi (sertleşme)", "Ünlü türemesi", "Hece düşmesi"], 1, "Sert ünsüzle (f, s, t, k, ç, ş, h, p) biten sözcüklere c, d, g ile başlayan ek gelince bu sesler ç, t, k olur."],
          ["“His + i → hissi” sözcüğünde hangi ses olayı vardır?", ["Ünsüz türemesi", "Ünlü türemesi", "Ünsüz düşmesi", "Ünlü düşmesi"], 0, "Arapçadan geçen bazı tek heceli sözcüklerde ünlüyle başlayan ek alınca ünsüz ikizleşir: his → hissi, af → affı."],
          ["“Küçük + cük → küçücük” sözcüğünde hangi ses olayı vardır?", ["Ünsüz düşmesi", "Ünlü düşmesi", "Ünsüz benzeşmesi", "Ünlü daralması"], 0, "k ile biten sıfatlara -cik eki gelince k düşer: küçük → küçücük, ufak → ufacık."],
          ["Hangisi Türkçede kaynaştırma ünsüzlerinden değildir?", ["y", "ş", "n", "r"], 3, "Kaynaştırma ünsüzleri y, ş, s, n'dir."],
          ["Hangi sözcük büyük ünlü uyumuna uymaz?", ["Kalem", "Okul", "Çiçek", "Bardak"], 0, "Büyük ünlü uyumunda kalın ünlüyü kalın, inceyi ince izler. “Kalem”de a (kalın) ile e (ince) bir aradadır."]
        ],
        tf: [
          ["“Burnu” sözcüğünde ünlü düşmesi vardır.", true, "burun + u → burnu: ikinci hecedeki “u” düşmüştür."],
          ["“Kitabı” sözcüğünde ünsüz yumuşaması vardır.", true, "kitap → kitabı: p → b."],
          ["“Başlıyor” sözcüğünde ünlü daralması vardır.", true, "başla + yor → başlıyor: a → ı."],
          ["“Sınıfta” sözcüğünde ünsüz yumuşaması vardır.", false, "“Sınıfta”da ünsüz benzeşmesi (sertleşme) vardır: -da → -ta."],
          ["Türkçede kaynaştırma ünsüzleri y, ş, s, n'dir.", true, "Örnek: kapıyı, ikişer, suyu-suyun (n), kuzusu (s)."],
          ["“Hissetmek” sözcüğünde ünlü türemesi vardır.", false, "“Hissetmek”te ünsüz türemesi (ikizleşme) vardır."],
          ["“Ağzı” sözcüğünde ünsüz düşmesi vardır.", false, "“Ağzı”da ünlü düşmesi vardır."],
          ["“Ufacık” sözcüğünde ünsüz düşmesi vardır.", true, "ufak + cık → ufacık: k düşmüştür."]
        ],
        pairs: [
          ["Ağzı", "Ünlü düşmesi"], ["Kitabı", "Ünsüz yumuşaması"], ["Sınıfta", "Ünsüz benzeşmesi"],
          ["Başlıyor", "Ünlü daralması"], ["Hissi", "Ünsüz türemesi"], ["Küçücük", "Ünsüz düşmesi"]
        ]
      }
    ]
  },

  /* ============================ MATEMATİK (üretilen sorular) ============================ */
  {
    id: "matematik", name: "Matematik", world: "Sayılar Adası", icon: "🧮", color: "#c0392b",
    units: [
      {
        id: "m1", title: "Temel İşlemler ve Sayılar",
        gen: {
          mc: () => pick([
            () => { const a = R(3, 15), b = R(3, 12), c = R(2, 40); return mcq(`${a} × ${b} + ${c} = ?`, a * b + c, 10, `Önce çarpma: ${a} × ${b} = ${a * b}, sonra toplama: ${a * b} + ${c} = ${a * b + c}.`); },
            () => { const a = R(5, 40), b = R(2, 9), c = R(2, 9), d = R(1, 10); const ans = a + b * c - d; return mcq(`${a} + ${b} × ${c} − ${d} = ?`, ans, 12, `İşlem önceliği: önce çarpma (${b} × ${c} = ${b * c}), sonra soldan sağa: ${a} + ${b * c} − ${d} = ${ans}.`); },
            () => { const a = pick([4, 6, 8, 9, 10, 12, 15]), b = pick([6, 8, 9, 10, 12, 14, 15, 18, 20]); const l = (a * b) / gcd(a, b); return mcq(`EKOK(${a}, ${b}) = ?`, l, Math.max(6, Math.floor(l / 3)), `EKOK = (a × b) / EBOB = (${a} × ${b}) / ${gcd(a, b)} = ${l}.`); },
            () => { const a = pick([12, 18, 24, 30, 36, 42, 48, 60]), b = pick([16, 20, 27, 32, 40, 45, 54, 72]); const g = gcd(a, b); return mcq(`EBOB(${a}, ${b}) = ?`, g, 4, `${a} ve ${b} sayılarını ortak bölen en büyük sayı ${g}'dir.`); },
            () => {
              const ok = 3 * R(34, 333);
              const bad = new Set();
              while (bad.size < 3) { const v = R(100, 999); if (v % 3 !== 0) bad.add(v); }
              const opts = shuf([ok, ...bad].map(String));
              return { type: "mc", q: "Aşağıdakilerden hangisi 3 ile tam bölünür?", opts, a: String(ok), ex: `Rakamları toplamı 3'ün katı olan sayılar 3'e tam bölünür. ${ok}: ${String(ok).split("").join(" + ")} = ${String(ok).split("").reduce((s, d) => s + +d, 0)}.` };
            }
          ])(),
          tf: () => pick([
            () => { const n = R(2, 70); const p = isPrime(n); return { type: "tf", q: `${n} bir asal sayıdır.`, a: p, ex: p ? `${n} yalnızca 1'e ve kendisine bölünür, asaldır.` : `${n} asal değildir; 1 ve kendisi dışında böleni vardır.` }; },
            () => { const a = R(3, 13), b = R(3, 13), real = a * b, shown = Math.random() < 0.5 ? real : real + pick([-2, -1, 1, 2, a, -b]); return { type: "tf", q: `${a} × ${b} = ${shown}`, a: shown === real, ex: `${a} × ${b} = ${real}.` }; },
            () => { const n = R(100, 999); const ok = n % 9 === 0; const s = String(n).split("").reduce((t, d) => t + +d, 0); return { type: "tf", q: `${n} sayısı 9 ile tam bölünür.`, a: ok, ex: `Rakamları toplamı ${s}. 9'un katı ${ok ? "olduğu için bölünür" : "olmadığı için bölünmez"}.` }; }
          ])(),
          pairs: () => {
            const used = new Set(), out = [];
            while (out.length < 6) { const a = R(3, 12), b = R(3, 12), p = a * b; if (used.has(p)) continue; used.add(p); out.push([`${a} × ${b}`, String(p)]); }
            return out;
          }
        }
      },
      {
        id: "m2", title: "Yüzde, Oran ve Problemler",
        gen: {
          mc: () => pick([
            () => { const p = pick([10, 20, 25, 30, 40, 50, 75]), n = 20 * R(2, 30), ans = (n * p) / 100; return mcq(`${n} sayısının %${p}'i kaçtır?`, ans, Math.max(5, Math.floor(ans / 4)), `${n} × ${p} / 100 = ${ans}.`); },
            () => { const p = pick([10, 20, 25, 30, 40, 50]), x = 20 * R(5, 50), ans = (x * (100 - p)) / 100; return mcq(`Fiyatı ${x} TL olan bir ürüne %${p} indirim yapılıyor. Yeni fiyat kaç TL olur?`, ans, Math.max(10, Math.floor(ans / 5)), `%${p} indirimde ürün %${100 - p}'ine satılır: ${x} × ${100 - p} / 100 = ${ans} TL.`); },
            () => { const d = R(4, 12), k = R(2, 5), t = d * (k + 1); return mcq(`Bir annenin yaşı kızının yaşının ${k} katıdır. Yaşları toplamı ${t} ise kızın yaşı kaçtır?`, d, 4, `Kız x, anne ${k}x. x + ${k}x = ${k + 1}x = ${t} → x = ${d}.`); },
            () => { const [a, b, c] = pick([[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [12, 6, 4]]); return mcq(`A bir işi ${a} günde, B aynı işi ${b} günde bitiriyor. İkisi birlikte bu işi kaç günde bitirir?`, c, 3, `Birlikte 1 günde: 1/${a} + 1/${b} = 1/${c}. Yani iş ${c} günde biter.`); },
            () => { const x = R(1, 5), y = R(2, 7); if (gcd(x, y) !== 1 || x === y) return mcq(`a/b = 2/3 ve a + b = 40 ise a kaçtır?`, 16, 5, `a = 2k, b = 3k → 5k = 40 → k = 8 → a = 16.`); const k = R(2, 12), t = (x + y) * k; return mcq(`a/b = ${x}/${y} ve a + b = ${t} ise a kaçtır?`, x * k, 6, `a = ${x}k, b = ${y}k → ${x + y}k = ${t} → k = ${k} → a = ${x * k}.`); }
          ])(),
          tf: () => pick([
            () => { const p = pick([10, 20, 25, 50]), n = 20 * R(2, 20), real = (n * p) / 100, shown = Math.random() < 0.5 ? real : real + pick([-5, 5, 10, -10]); return { type: "tf", q: `${n} sayısının %${p}'i ${shown}'dir.`, a: shown === real, ex: `${n} × ${p} / 100 = ${real}.` }; },
            () => pick([
              { type: "tf", q: "Bir sayının %50'si o sayının yarısıdır.", a: true, ex: "%50 = 50/100 = 1/2." },
              { type: "tf", q: "%25 indirim, fiyatın dörtte birinin düşülmesi demektir.", a: true, ex: "%25 = 1/4." },
              { type: "tf", q: "Bir ürüne önce %10 zam sonra %10 indirim yapılırsa fiyat değişmez.", a: false, ex: "100 → 110 → 99. Fiyat %1 azalır." },
              { type: "tf", q: "%20 = 1/5'tir.", a: true, ex: "20/100 = 1/5." },
              { type: "tf", q: "Bir sayının %200'ü, o sayının 3 katıdır.", a: false, ex: "%200 = 2 kat." }
            ])
          ])(),
          pairs: () => shuf([["%50", "1/2"], ["%25", "1/4"], ["%20", "1/5"], ["%10", "1/10"], ["%75", "3/4"], ["%40", "2/5"], ["%12,5", "1/8"], ["%60", "3/5"]]).slice(0, 6)
        }
      }
    ]
  }
];

/* =====================================================================
 * Ek içerik: yeni oyun modları için
 *  groups : İki Kutu ve Balon Avı -> [[grupAdı, [öğeler]], [grupAdı, [öğeler]]]
 *  words  : Gizli Kelime          -> [cevap, ipucu]
 * ===================================================================== */
const EXTRA = {
  t1: {
    groups: [
      ["Göktürkler", ["Bumin Kağan", "Orhun Yazıtları", "Türk adını devlet adı yapma", "Bilge Kağan", "Tonyukuk", "Kül Tigin", "552'de kuruluş", "İstemi Yabgu"]],
      ["Uygurlar", ["Bögü Kağan", "Maniheizm'i kabul", "Yerleşik hayata ilk geçiş", "Uygur alfabesi", "Matbaa kullanımı", "Kutluk Bilge Kül Kağan", "744'te kuruluş", "Savaşçı özelliklerin zayıflaması"]]
    ],
    words: [
      ["KURULTAY", "Eski Türklerde devlet işlerinin görüşüldüğü meclis"],
      ["METE HAN", "Orduda onlu sistemi kuran Asya Hun hükümdarı"],
      ["TALAS", "751'de Türklerin Abbasilerle birlikte Çin'e karşı savaştığı yer"],
      ["UYGURLAR", "Yerleşik hayata geçen ilk Türk devleti"],
      ["KUT", "Yönetme yetkisinin Tanrı tarafından verildiği inancı"],
      ["ATTİLA", "Avrupa Hun Devleti'nin en ünlü hükümdarı"]
    ]
  },
  t2: {
    groups: [
      ["Yavuz Sultan Selim dönemi", ["Çaldıran Savaşı", "Mercidabık Savaşı", "Ridaniye Savaşı", "Halifeliğin Osmanlı'ya geçmesi", "Turnadağ Savaşı", "Mısır Seferi", "Kutsal emanetlerin İstanbul'a getirilmesi"]],
      ["Kanuni dönemi", ["Mohaç Meydan Muharebesi", "Preveze Deniz Savaşı", "Belgrad'ın fethi (1521)", "Rodos'un fethi (1522)", "I. Viyana Kuşatması (1529)", "Amasya Antlaşması (1555)", "Zigetvar Seferi"]]
    ],
    words: [
      ["DEVŞİRME", "Hristiyan ailelerin çocuklarının devlet hizmeti için yetiştirilmesi sistemi"],
      ["FETRET", "Ankara Savaşı sonrası şehzadeler arası taht kavgası dönemi: ... Devri"],
      ["PREVEZE", "Barbaros'un 1538'de Haçlı donanmasını yendiği deniz savaşı"],
      ["MOHAÇ", "Kanuni'nin 1526'da Macarları yendiği meydan muharebesi"],
      ["AKÇE", "Orhan Bey döneminde basılan ilk Osmanlı gümüş parası"],
      ["BURSA", "Orhan Bey döneminde alınıp başkent yapılan şehir"]
    ]
  },
  c1: {
    groups: [
      ["Karadeniz iklimi", ["Her mevsim yağışlı", "Kurak mevsim yok", "Doğal bitki örtüsü orman", "Yazları serin", "Çay ve fındık yetişir", "Rize kıyıları", "En fazla yağış alan iklim"]],
      ["Akdeniz iklimi", ["Yazları sıcak ve kurak", "Kışları ılık ve yağışlı", "Doğal bitki örtüsü maki", "Antalya kıyıları", "Zeytin ve turunçgil yetişir", "Yaz kuraklığı belirgin", "Kızılçam ormanları"]]
    ],
    words: [
      ["AĞRI", "Türkiye'nin en yüksek dağı (5137 m): ... Dağı"],
      ["VAN", "Türkiye'nin en büyük gölü: ... Gölü"],
      ["KIZILIRMAK", "Tamamı Türkiye'de olan en uzun akarsu"],
      ["MAKİ", "Akdeniz ikliminin doğal bitki örtüsü"],
      ["RİZE", "Türkiye'de en çok yağış alan il"],
      ["KONYA", "Yüzölçümü en büyük il"],
      ["IĞDIR", "Türkiye'nin en doğusundaki il"]
    ]
  },
  c2: {
    groups: [
      ["Karadeniz Bölgesi", ["Çay", "Fındık", "Zonguldak taşkömürü", "Hamsi avcılığı", "Bafra tütünü", "Murgul bakırı"]],
      ["Ege Bölgesi", ["Zeytin", "İncir", "Afyon haşhaşı", "Manisa üzümü", "Soma linyiti", "Pamukkale travertenleri"]]
    ],
    words: [
      ["BOR", "Türkiye'nin dünyada en büyük rezervine sahip olduğu maden"],
      ["GAP", "Fırat ve Dicle havzasını kapsayan kalkınma projesinin kısaltması"],
      ["ZONGULDAK", "Taşkömürü havzası olan il"],
      ["LÜLETAŞI", "Eskişehir'e özgü mineral"],
      ["FINDIK", "Ordu ve Giresun'un öne çıkan tarım ürünü"],
      ["ÇAY", "Rize'de en çok yetiştirilen tarım ürünü"]
    ]
  },
  v1: {
    groups: [
      ["Yasama (TBMM)", ["Kanun yapmak", "Bütçe kanununu kabul etmek", "Savaş ilanına karar vermek", "Para basılmasına karar vermek", "Genel ve özel af ilanı", "Uluslararası antlaşmaların onaylanmasını uygun bulmak"]],
      ["Yürütme (Cumhurbaşkanı)", ["Kanunları yayımlamak", "Bakanları atamak", "Cumhurbaşkanlığı kararnamesi çıkarmak", "Kanunu tekrar görüşülmek üzere TBMM'ye geri göndermek", "MGK'ya başkanlık etmek", "Büyükelçi atamak"]]
    ],
    words: [
      ["KANUN-İ ESASİ", "1876'da ilan edilen ilk Osmanlı anayasası"],
      ["YASAMA", "TBMM'ye ait olan ve devredilemeyen yetki"],
      ["YARGI", "Bağımsız ve tarafsız mahkemelerce kullanılan yetki"],
      ["YÜRÜTME", "Cumhurbaşkanı'na ait olan yetki"],
      ["HALKOYLAMASI", "1982 Anayasası'nın kabul edildiği yöntem"],
      ["ANAYASA MAHKEMESİ", "1961 Anayasası ile kurulan, 15 üyeli yüksek mahkeme"]
    ]
  },
  v2: {
    groups: [
      ["Kamu hukuku", ["Ceza hukuku", "Anayasa hukuku", "İdare hukuku", "Vergi hukuku", "Ceza muhakemesi hukuku", "Devletler genel hukuku"]],
      ["Özel hukuk", ["Medeni hukuk", "Borçlar hukuku", "Ticaret hukuku", "Devletler özel hukuku", "Aile hukuku", "Eşya hukuku"]]
    ],
    words: [
      ["ERGİNLİK", "18 yaşın doldurulmasıyla kazanılan durum"],
      ["ANAYASA", "Normlar hiyerarşisinin en üstündeki kural"],
      ["ÖRF VE ADET", "Hukukun yazısız asli kaynağı"],
      ["YERLEŞİM YERİ", "Kişinin sürekli kalma niyetiyle oturduğu yer"],
      ["HAK EHLİYETİ", "Haklara ve borçlara sahip olabilme yeteneği"],
      ["KISITLILIK", "Mahkeme kararıyla fiil ehliyetinin sınırlanması"]
    ]
  },
  tr1: {
    groups: [
      ["Doğru yazım", ["yalnız", "herkes", "orijinal", "şoför", "egzoz", "kılavuz", "makine", "yanlış"]],
      ["Yanlış yazım", ["yanlız", "herkez", "orjinal", "şöför", "egsoz", "klavuz", "makina", "yalnış"]]
    ],
    words: [
      ["KILAVUZ", "Yol gösteren kişi ya da kitap (yazımına dikkat!)"],
      ["YALNIZ", "Tek başına olan (yazımına dikkat!)"],
      ["ORİJİNAL", "Özgün, kopya olmayan"],
      ["EGZOZ", "Motorlu araçlarda yanmış gazları dışarı atan boru"],
      ["ŞOFÖR", "Araç sürücüsü"],
      ["HERKES", "Bütün insanlar"]
    ]
  },
  tr2: {
    groups: [
      ["Ünlü düşmesi", ["ağzı", "burnu", "oğlu", "gönlü", "alnı", "karnı", "boynu", "beyni"]],
      ["Ünsüz yumuşaması", ["kitabı", "ağacı", "kanadı", "çorabı", "köpeği", "dolabı", "yurdu", "kazancı"]]
    ],
    words: [
      ["YUMUŞAMA", "p, ç, t, k seslerinin b, c, d, g/ğ'ye dönüşmesi: ünsüz ..."],
      ["DARALMA", "başla + yor → başlıyor: ünlü ..."],
      ["BENZEŞME", "sınıf + da → sınıfta: ünsüz ..."],
      ["KAYNAŞTIRMA", "y, ş, s, n harflerinin görevi: ... ünsüzü"],
      ["TÜREME", "his + i → hissi: ünsüz ..."],
      ["DÜŞME", "ağız + ı → ağzı: ünlü ..."]
    ]
  }
};

// Matematik için kategoriler de üretilir
const MATH_GROUPS = {
  m1: () => {
    const p = new Set(), np = new Set();
    while (p.size < 7) { const n = R(2, 97); if (isPrime(n)) p.add(String(n)); }
    while (np.size < 7) { const n = R(4, 99); if (!isPrime(n)) np.add(String(n)); }
    return [["Asal sayı", [...p]], ["Asal değil", [...np]]];
  },
  m2: () => [
    ["1/2'den büyük", shuf(["%60", "3/4", "0,7", "%85", "5/8", "0,9", "2/3", "%55"]).slice(0, 7)],
    ["1/2'den küçük", shuf(["%30", "2/5", "0,25", "%45", "1/3", "0,1", "3/8", "%12"]).slice(0, 7)]
  ]
};

for (const s of window.SUBJECTS) for (const u of s.units) {
  Object.assign(u, EXTRA[u.id] || {});
  if (u.gen && MATH_GROUPS[u.id]) u.gen.groups = MATH_GROUPS[u.id];
}
