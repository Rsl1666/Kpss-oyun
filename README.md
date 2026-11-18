# KPSS Oyun 🎮📚

Oynayarak KPSS'ye hazırlanma uygulaması. Her ders bir **dünya**, her konu bir **harita** ve haritadaki her durak farklı bir **mini oyun**.

## Nasıl çalıştırılır?
Kurulum gerekmez. `index.html` dosyasını tarayıcıda açman yeterli.
İstersen yerel sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
```

## Oyun yapısı
### Haritadaki duraklar (her ünitede)
| Mod | Mekanik |
|---|---|
| ❓ **Bilgi Yarışı** | Süreli çoktan seçmeli. Hızlı cevap ve kombo daha çok XP verir. |
| 🃏 **Hafıza Kartları** | Kapalı kartları çevir, birbirine ait çiftleri bul. Az hamle = çok yıldız. |
| 🗂️ **İki Kutu** | Gelen kartı doğru kategoriye at (ör. Kamu hukuku / Özel hukuk). Klavyede ← / →. |
| ⚡ **Hız Turu** | Süre bitmeden olabildiğince çok Doğru/Yanlış cevapla. |
| 🔤 **Gizli Kelime** | İpucundan cevabı harf harf bul; 6 hakkın var, istersen harf aç. |
| 🎈 **Balon Avı** | Yükselen balonlardan sadece hedef gruba ait olanları patlat. 3 can. |
| 🧩 **Eşleştir** | Kavram ile karşılığını eşleştir. |
| 📜 **Kronoloji** | Olayları doğru sıraya diz. |
| 🐉 **Boss Savaşı** | Ünite sonu karışık sınav; 3 canın var. |

### Oyun Salonu (istediğin dersten / karışık)
| Mod | Mekanik |
|---|---|
| ⚔️ **Düello** | Rakip bota karşı 7 soru. Hem doğru hem hızlı olan kazanır; bot seviyenle güçlenir. |
| 🗼 **Bilgi Kulesi** | 12 kat, her kat daha çok XP. Yanlışta düşersin ama 🛡️ baraj katları ödülü korur. Jokerler: %50, +15 sn, Pas. İstediğin an çekilebilirsin. |

### Diğer
| | |
|---|---|
| 🎁 **Günün Görevi** | Tüm derslerden 10 karışık soru, günde bir kez +50 bonus XP. |
| 📕 **Hata Defteri** | Yanlış yaptığın her soru buraya düşer; doğru cevapladığında silinir. |

**İlerleme sistemi:** XP & seviye, unvanlar (Aday → Efsane), günlük seri 🔥, bölüm başına 1–3 yıldız, kilitli duraklar ve rozetler. İlerleme tarayıcıda (`localStorage`) saklanır.

Her sorudan sonra **açıklama** gösterilir; amaç sadece puan değil, konuyu öğretmek.

## Dersler (şu anki içerik)
- 🏛️ Tarih: İslamiyet Öncesi Türk Tarihi, Osmanlı Kuruluş ve Yükselme
- 🗺️ Coğrafya: Türkiye'nin Konumu ve Fiziki Özellikleri, Türkiye Ekonomisi
- ⚖️ Vatandaşlık: Anayasa ve Devlet Yapısı, Temel Hukuk Kavramları
- 📖 Türkçe: Yazım Kuralları, Ses Bilgisi
- 🧮 Matematik: Temel İşlemler, Yüzde/Oran/Problemler (sorular **otomatik üretilir**, sonsuz pratik)

## Soru eklemek
Tüm içerik `js/data.js` dosyasında. Yeni bir ünite eklemek için ilgili dersin `units` dizisine şu yapıda bir nesne ekle:

```js
{
  id: "t3", title: "Kurtuluş Savaşı",
  mc:    [["Soru?", ["A", "B", "C", "D"], dogruIndex, "Açıklama"]],
  tf:    [["İfade.", true, "Açıklama"]],
  pairs: [["Sol", "Sağ"]],                       // 6 çift önerilir
  order: [{ prompt: "Eskiden yeniye sırala", items: [["Olay", "Tarih"], ...] }], // isteğe bağlı
  groups: [["Grup A", ["öğe", ...]], ["Grup B", ["öğe", ...]]],             // İki Kutu + Balon Avı
  words:  [["CEVAP", "İpucu"]]                                              // Gizli Kelime
}
```
Harita ve oyun durakları otomatik oluşur.

## Dosyalar
```
index.html      giriş
css/style.css   arayüz
js/data.js      soru bankası + matematik soru üreteçleri
js/app.js       oyun motoru (ekranlar, modlar, XP, rozetler, kayıt)
```
