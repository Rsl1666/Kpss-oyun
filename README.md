# KPSS Oyun 🎮📚

Oynayarak KPSS'ye hazırlanma uygulaması. Her ders bir **dünya**, her konu bir **harita** ve haritadaki her durak farklı bir **mini oyun**.

## Nasıl çalıştırılır?
Kurulum gerekmez. `index.html` dosyasını tarayıcıda açman yeterli.
İstersen yerel sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
```

## Oyun yapısı
| Mod | Açıklama |
|---|---|
| ❓ **Bilgi Yarışı** | Süreli çoktan seçmeli sorular. Hızlı cevap ve kombo daha çok XP verir. |
| ⚡ **Hız Turu** | Süre bitmeden olabildiğince çok Doğru/Yanlış cevapla (klavyede ← / →). |
| 🧩 **Eşleştir** | Kavram ile karşılığını eşleştir (padişah–olay, il–ürün, yanlış–doğru yazım…). |
| 📜 **Kronoloji** | Olayları doğru sıraya diz. |
| 🐉 **Boss Savaşı** | Ünite sonu karışık sınav; 3 canın var. |
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
  order: [{ prompt: "Eskiden yeniye sırala", items: [["Olay", "Tarih"], ...] }] // isteğe bağlı
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
