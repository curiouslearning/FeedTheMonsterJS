importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
workbox.precaching.precacheAndRoute([{"revision":"c5977ce9c754b5132685edd57010bd0a","url":"assets/audios/are-you-sure.mp3"},{"revision":"ec214e1eef89105b484900ac15d92649","url":"assets/audios/ButtonClick.mp3"},{"revision":"ec214e1eef89105b484900ac15d92649","url":"assets/audios/ButtonClick.wav"},{"revision":"502d2c741145a1cae081c73a9a31adc8","url":"assets/audios/Cheering-01.mp3"},{"revision":"53a8bfd7392adf8910b433ce13ab4af0","url":"assets/audios/Cheering-02.mp3"},{"revision":"5197225d0e79a19d50e75000128fd3d2","url":"assets/audios/Cheering-03.mp3"},{"revision":"9d98684dcd9532f8631cce867fff0c13","url":"assets/audios/CorrectStoneFinal.mp3"},{"revision":"2431a6bb00bfeecfb2d5404bdd087b24","url":"assets/audios/Disapointed-05.mp3"},{"revision":"5ef47da84396ad9a4b83235b87211c04","url":"assets/audios/Eat.mp3"},{"revision":"f27755d5596c69afa238221f75a19afe","url":"assets/audios/fantastic.WAV"},{"revision":"f3349f9e400da37876c81913c0be026e","url":"assets/audios/good job.WAV"},{"revision":"54e68bba98cc48aa41ab13a27f36ae96","url":"assets/audios/great.wav"},{"revision":"21a9071743deb5ef58f5a44ced6ec3ac","url":"assets/audios/intro.mp3"},{"revision":"6136d62b03b9a373e45219606edbb877","url":"assets/audios/LevelLoseFanfare.mp3"},{"revision":"7c86597b8546ae3274789bf8bc1ed9a0","url":"assets/audios/LevelWinFanfare.mp3"},{"revision":"227040add97b1daecd5c21c2623e480a","url":"assets/audios/Monster Spits wrong stones-01.mp3"},{"revision":"227040add97b1daecd5c21c2623e480a","url":"assets/audios/MonsterSpit.mp3"},{"revision":"cf0c6919347cc45bc20028d6155aa5d7","url":"assets/audios/onDrag.mp3"},{"revision":"828da03d5334d4d2a5ef162941982807","url":"assets/audios/PointsAdd.wav"},{"revision":"685da4a6886babc85061d0ab8224a0cf","url":"assets/audios/timeout.mp3"},{"revision":"ca2ad994822e8e26eacb60417780697f","url":"assets/container_app_icons/assessment_icon_dev.png"},{"revision":"fe7763c3cca39fa1770bbe173944d94e","url":"assets/container_app_icons/assessment_icon_prod.png"},{"revision":"89d73b82c8d04d451e85b3f049780c50","url":"assets/container_app_icons/ftm_afrikaans_dev.png"},{"revision":"ae8db2046490b38256a431f08faf3c8c","url":"assets/container_app_icons/ftm_afrikaans_prod.png"},{"revision":"1c6af647e23fc429b04b351aaf9f8041","url":"assets/container_app_icons/ftm_arabic_dev.png"},{"revision":"a6754b00d8628392de0322b186aba8b9","url":"assets/container_app_icons/ftm_arabic_prod.png"},{"revision":"96c63fce220938a134575e65d3276cb5","url":"assets/container_app_icons/ftm_austrailianenglish_dev.png"},{"revision":"68444d4bf286b60724f31c2f2587e01d","url":"assets/container_app_icons/ftm_austrailianenglish_prod.png"},{"revision":"8247202159298042be7f7edcd967ae03","url":"assets/container_app_icons/ftm_azerbaijani_dev.png"},{"revision":"fa4528dabe0d4fb2239c31e556ef9ae1","url":"assets/container_app_icons/ftm_azerbaijani_prod.png"},{"revision":"f1f6aa181579cb9c7ac99ee8664d0782","url":"assets/container_app_icons/ftm_bangla_dev.png"},{"revision":"f677c2105994e4c69b8d3f5464c9233e","url":"assets/container_app_icons/ftm_brazilianportuguese_dev.png"},{"revision":"15a18979f8cc96763658233e1d1635f9","url":"assets/container_app_icons/ftm_brazilianportuguese_prod.png"},{"revision":"f6764784c3469997a9942cdfefcc42a9","url":"assets/container_app_icons/ftm_CicadasSong_dev.png"},{"revision":"3653c902d6472078a7a8726af2707151","url":"assets/container_app_icons/ftm_Colours_dev.png"},{"revision":"94a15cd79caca30b117f5c29887e1ea5","url":"assets/container_app_icons/ftm_Colours_prod.png"},{"revision":"e4495a4f44b3177f92cec6fc7a21ceca","url":"assets/container_app_icons/ftm_english_dev copy 1.png"},{"revision":"96463b23d04aebcb85880575db49b9a3","url":"assets/container_app_icons/ftm_english_dev.png"},{"revision":"d093c725e2cac2f978411ca2ab9457c0","url":"assets/container_app_icons/ftm_english_prod.png"},{"revision":"b03d0eb276c7b1ff5a8bc80aca883185","url":"assets/container_app_icons/ftm_english.png"},{"revision":"2f583d2b779a7754c970cbb5e3772ab9","url":"assets/container_app_icons/ftm_englishwestafrican_dev.png"},{"revision":"6bba1de48b5ea8aad7f6bb685a6bccae","url":"assets/container_app_icons/ftm_englishwestafrican_prod.png"},{"revision":"b5a5857c5fde48c5c0c16e5db5e37b3c","url":"assets/container_app_icons/ftm_farsi_dev.png"},{"revision":"d2298dc981174537c86c76b469d8687b","url":"assets/container_app_icons/ftm_french_dev.png"},{"revision":"15834c727b5325392209b0ba4b445dc9","url":"assets/container_app_icons/ftm_french_prod.png"},{"revision":"66a560aa61e7ca4d3f92c02760ad9a8f","url":"assets/container_app_icons/ftm_georgian_dev.png"},{"revision":"551e774ecab25a00149b563ee5a873a0","url":"assets/container_app_icons/ftm_georgian_prod.png"},{"revision":"d28ad7c7e8cdc7e68f1f81b142333d8a","url":"assets/container_app_icons/ftm_haitiancreole_dev.png"},{"revision":"124ac7adaa8010b192570e67c9be6de1","url":"assets/container_app_icons/ftm_haitiancreole_prod.png"},{"revision":"76025f33231d58094995ecb1d249566d","url":"assets/container_app_icons/ftm_hausa_dev.png"},{"revision":"4e7e006fea6d05d866fee68ce68dd469","url":"assets/container_app_icons/ftm_hausa_prod.png"},{"revision":"b4f5f7d882a39de598d4c60ffbf07d1d","url":"assets/container_app_icons/ftm_HideAndSeek_dev.png"},{"revision":"374980964450bc24454048a6093c68c1","url":"assets/container_app_icons/ftm_HideAndSeek_prod.png"},{"revision":"4af53c792030eccfa785d0a14494d9a9","url":"assets/container_app_icons/ftm_hindi_dev.png"},{"revision":"da3b9d58bd2d9fb17ca9e3f084ee18de","url":"assets/container_app_icons/ftm_hindi.png"},{"revision":"e3787393617522a0c521a68d4f0a5f41","url":"assets/container_app_icons/ftm_igbo_dev.png"},{"revision":"bc0df5d31cd302020754b72ec83780ab","url":"assets/container_app_icons/ftm_igbo_prod.png"},{"revision":"4e1402597ebf113abed999934fdfae67","url":"assets/container_app_icons/ftm_indianenglish_dev.png"},{"revision":"94ec392fc8edb6649a025d6006bc9d5c","url":"assets/container_app_icons/ftm_indianenglish_prod.png"},{"revision":"e949261a5ef884a95893c61209255318","url":"assets/container_app_icons/ftm_isixhosa_dev.png"},{"revision":"0ca1b672d9be63d1508bd33cf2b9c1fe","url":"assets/container_app_icons/ftm_isixhosa_prod.png"},{"revision":"ada6b37424c632e3107d85dde013a6b5","url":"assets/container_app_icons/ftm_javanese_prod.png"},{"revision":"7c2aa558a8a45795421dc548df153bd7","url":"assets/container_app_icons/ftm_kinyarwanda_dev.png"},{"revision":"5307eb25f6664a1c90e9fd7d34e42f1c","url":"assets/container_app_icons/ftm_kinyarwanda_prod.png"},{"revision":"e9e4027e01b94bb7ea83d3554a2168d9","url":"assets/container_app_icons/ftm_kurdish_dev.png"},{"revision":"06f0d7a8f8ffda72d75ddaf99f4da8c1","url":"assets/container_app_icons/ftm_kurdish_prod.png"},{"revision":"b7010c3e3060ea4dabafa8557f232460","url":"assets/container_app_icons/ftm_lugandan_dev.png"},{"revision":"56c3b22c1b375c611687482070928d08","url":"assets/container_app_icons/ftm_lugandan_prod.png"},{"revision":"905878e212d72745e8d796e07e199392","url":"assets/container_app_icons/ftm_malay_dev.png"},{"revision":"14b7a2efb34744995da406384646e7d2","url":"assets/container_app_icons/ftm_malay_prod.png"},{"revision":"8e1c7bd5e2d8d61b192c6fac1c3e06a4","url":"assets/container_app_icons/ftm_malgache_prod.png"},{"revision":"d0efaa69b6ee78d042dd16d38de47f28","url":"assets/container_app_icons/ftm_marathi_dev.png"},{"revision":"61cb77a8a017e2c7a071e63fa75c401d","url":"assets/container_app_icons/ftm_ndebele_dev.png"},{"revision":"06d675a1304be11a24562c0f038f7725","url":"assets/container_app_icons/ftm_ndebele_prod.png"},{"revision":"407eff15545ff18beb075877e0e935e3","url":"assets/container_app_icons/ftm_nepali_dev.png"},{"revision":"4d73041c11fc6897f26b90d7d421d72b","url":"assets/container_app_icons/ftm_nepali_prod.png"},{"revision":"25c60840b5a32f07f272caca43054e55","url":"assets/container_app_icons/ftm_pashto_dev.png"},{"revision":"b09b39c7582ebecb5cda8c5ff0d8b021","url":"assets/container_app_icons/ftm_pashto_prod.png"},{"revision":"ff91a7f9a4df0ac7292e2e9b7a8fcbbe","url":"assets/container_app_icons/ftm_punjabi_dev.png"},{"revision":"f453b883da366d0f0113743af2bdab45","url":"assets/container_app_icons/ftm_saenglish_dev.png"},{"revision":"74594f39a03b130529fcf88e5bf85264","url":"assets/container_app_icons/ftm_saenglish_prod.png"},{"revision":"68ec940f3e8feaecacc6cdcc8f5d7225","url":"assets/container_app_icons/ftm_sepedi_dev.png"},{"revision":"f4c85806b43efa92436dba5573adedc0","url":"assets/container_app_icons/ftm_sepedi_prod.png"},{"revision":"b24f57c94656b6754b8a9fe9185d0c35","url":"assets/container_app_icons/ftm_sesotho_dev.png"},{"revision":"d894ebdc019df7a5fd8ceeafbf6bd99e","url":"assets/container_app_icons/ftm_sesotho_prod.png"},{"revision":"54b0cbb7c070d869d4738e40bed7eacc","url":"assets/container_app_icons/ftm_shona_dev.png"},{"revision":"91a86f12a7823160c47fe60570e4e40f","url":"assets/container_app_icons/ftm_shona_prod.png"},{"revision":"564017d55be0c8388e1f6b7280e9c3c3","url":"assets/container_app_icons/ftm_siswati_dev.png"},{"revision":"de08502e8aeadb265d6d9fefb26f1b49","url":"assets/container_app_icons/ftm_siswati_prod.png"},{"revision":"18f434e5b2d52b05881a695c7ba23c6a","url":"assets/container_app_icons/ftm_somali_prod.png"},{"revision":"460a9aac14f949da2ce3e158bcd8e238","url":"assets/container_app_icons/ftm_spanish_dev.png"},{"revision":"2b96dd1556368d0696ba8178ef07893a","url":"assets/container_app_icons/ftm_spanish_prod.png"},{"revision":"d2a8f1cb814feada2ec979149e013eea","url":"assets/container_app_icons/ftm_swahili_dev.png"},{"revision":"5dcea429f87599366ad323a2fed82639","url":"assets/container_app_icons/ftm_swahili_prod.png"},{"revision":"99447be072fb019b8d64ecd6bd9f5e7a","url":"assets/container_app_icons/ftm_tagalog_dev.png"},{"revision":"6ac6f63bc94eb9a1af236514e5cef846","url":"assets/container_app_icons/ftm_tagalog_prod.png"},{"revision":"2326ccb5005468b60fbbeef7f9d77799","url":"assets/container_app_icons/ftm_tajik_dev.png"},{"revision":"f3a0d2698d95e31df92fc04038dd065c","url":"assets/container_app_icons/ftm_tajik_prod.png"},{"revision":"a28201b0840957772bb3b23d9b39aef9","url":"assets/container_app_icons/ftm_tallandshort_dev.png"},{"revision":"e97e0265652d54f076305f9b429c4872","url":"assets/container_app_icons/ftm_tallandshort_prod.png"},{"revision":"69d20c5a104d82fcdac8a82a9a84a70c","url":"assets/container_app_icons/ftm_thai_dev.png"},{"revision":"b4df08f9c61a2348c2d93e1aabb299ee","url":"assets/container_app_icons/ftm_thai_prod.png"},{"revision":"3c37505763f05c3f515de15de4b82738","url":"assets/container_app_icons/ftm_TheBeeAndTheElephant_dev.png"},{"revision":"322d1681fe04ae40b9c6207e25688199","url":"assets/container_app_icons/ftm_TheBeeAndTheElephant_prod.png"},{"revision":"b0016022b0039f855a19a8447783c3ee","url":"assets/container_app_icons/ftm_TheLostDoll_dev.png"},{"revision":"d5c39e65fb7fd31bd1963d976ef7e56b","url":"assets/container_app_icons/ftm_TheLostDoll_prod.png"},{"revision":"592f8c46be918d88430726c120cfb4e4","url":"assets/container_app_icons/ftm_tsonga_dev.png"},{"revision":"975f81f68fdcade43da14c58e632f6db","url":"assets/container_app_icons/ftm_tsonga_prod.png"},{"revision":"1ccb390352ac31f127f0faf61b202ec9","url":"assets/container_app_icons/ftm_tswana_dev.png"},{"revision":"88b0478c2049a061c3164286b1a372f6","url":"assets/container_app_icons/ftm_tswana_prod.png"},{"revision":"94b84ec2e07752b911b1b52ac61097d2","url":"assets/container_app_icons/ftm_turkish_dev.png"},{"revision":"433ccaa701a3657468c1ece88c5f3a3f","url":"assets/container_app_icons/ftm_turkish_prod.png"},{"revision":"4dd7c9ed7207bed27e453b0441199cfb","url":"assets/container_app_icons/ftm_twi_dev.png"},{"revision":"63a82db40ae07848dddbe104c22d31c5","url":"assets/container_app_icons/ftm_twi_prod.png"},{"revision":"ed1b5015b1ff42b181ac4b3e6fab481d","url":"assets/container_app_icons/ftm_ukrainian_dev.png"},{"revision":"ff70984515034ef91705c73cb91bdad6","url":"assets/container_app_icons/ftm_ukrainian_prod.png"},{"revision":"5b2327dab7e89c3451bbb96974d5a7e4","url":"assets/container_app_icons/ftm_venda_dev.png"},{"revision":"4d33ffd42b4bfa1700edfd2189895692","url":"assets/container_app_icons/ftm_venda_prod.png"},{"revision":"fc7c35ba88c51ed947f226e0341262e5","url":"assets/container_app_icons/ftm_vietnamese_dev.png"},{"revision":"4754f92155ff37328d72b81e6157337e","url":"assets/container_app_icons/ftm_vietnamese_prod.png"},{"revision":"d394cf717ad847d5bd0f1623021ea329","url":"assets/container_app_icons/ftm_wolof_dev.png"},{"revision":"b24c32b20815ef0d26c13c275129db0f","url":"assets/container_app_icons/ftm_wolof_prod.png"},{"revision":"145cfa96bd0196333de937744b14c02c","url":"assets/container_app_icons/ftm_yoruba_dev.png"},{"revision":"61c5124c054b4b230835b4cddf1b982e","url":"assets/container_app_icons/ftm_yoruba_prod.png"},{"revision":"b69aae7b8fde8af8b2c3e1a3cdaf0667","url":"assets/container_app_icons/ftm_zulu_dev.png"},{"revision":"6d4cf721dd596b4e6ad54a21577988b0","url":"assets/container_app_icons/ftm_zulu_prod.png"},{"revision":"2246763aec54337dbf387684c84929d6","url":"assets/container_app_icons/hideandseek_dev.png"},{"revision":"275341f462a38c53214eafc80ffc961a","url":"assets/container_app_icons/LetsFly_dev.png"},{"revision":"1fc2756af7d95adda6afc000ff843f6b","url":"assets/container_app_icons/LetsFly_icon.png"},{"revision":"1fc2756af7d95adda6afc000ff843f6b","url":"assets/container_app_icons/LetsFly_prod.png"},{"revision":"891d5740c1af1fad4da3afee1289c11c","url":"assets/container_app_icons/LetsFly1.png"},{"revision":"db1df123dd0e87ecf15276c5bbb12681","url":"assets/images/Autumn_bg_v01.jpg"},{"revision":"7fe5017810edcafd41d12bd23c0046d6","url":"assets/images/Autumn_bg_v01.webp"},{"revision":"c1faadf17b183089038d2a6a359a67fc","url":"assets/images/Autumn_fence_v01.png"},{"revision":"862c295effcb72aac9f1a9826d3baae8","url":"assets/images/Autumn_fence_v01.webp"},{"revision":"86393c975f42233b8548e6dcb844c0c7","url":"assets/images/Autumn_FG_v01.png"},{"revision":"3a0d9f43746bbfeee5381e88de0037e6","url":"assets/images/Autumn_hill_v01.png"},{"revision":"f378f0c9469cb8418cb0b7b41ecef464","url":"assets/images/Autumn_hill_v01.webp"},{"revision":"2c8c0d05efda1d7c0d8c4b4c2dfdca06","url":"assets/images/Autumn_hill.webp"},{"revision":"f3187610fd203a4e83f1a6ca42b92701","url":"assets/images/Autumn_sign_v01.png"},{"revision":"7432f4abb9a3a9a0270c45581f7ed2a8","url":"assets/images/Autumn_sign_v01.webp"},{"revision":"350b01e0bccbc96d411eab95d2306802","url":"assets/images/back_btn.png"},{"revision":"728228dd61fdf648a0029f6236099c40","url":"assets/images/back_btn.webp"},{"revision":"d6529000992906e214d4e823e63649cb","url":"assets/images/bar_empty_v01.png"},{"revision":"c08f6412c0b44c13b5b05c0724fa15bb","url":"assets/images/bar_empty_v01.webp"},{"revision":"811d3537ac3d81d68ec6f9484d78540c","url":"assets/images/bar_full_v01.png"},{"revision":"10e4b19b33603aefbf9e43423e3b91c0","url":"assets/images/bar_full_v01.webp"},{"revision":"0eb874baac10d2a76c7cc657c756acdf","url":"assets/images/bg_v01.jpg"},{"revision":"8392633b41bc6a1c95d29c9f2ddb845f","url":"assets/images/bg_v01.webp"},{"revision":"11d8d6133c5299e99f95d9761c850ca1","url":"assets/images/close_btn.png"},{"revision":"3a54f5fe0867c02cf0c8c957ff6288d5","url":"assets/images/close_btn.webp"},{"revision":"93324625f6b250c840a4c845d6a4d195","url":"assets/images/cloud_01.png"},{"revision":"c50d68cb8b44820bf0adda49fcdfc163","url":"assets/images/cloud_01.webp"},{"revision":"0208ccae7af055011d300e720b03a0ed","url":"assets/images/cloud_02.png"},{"revision":"5c42dcc9dc71d00b76206192c1beef41","url":"assets/images/cloud_02.webp"},{"revision":"2d17eefbe310cc0c68f15942e8fc2b7c","url":"assets/images/cloud_03.png"},{"revision":"12da0fa666a06b9716deecdad55fa4c6","url":"assets/images/cloud_03.webp"},{"revision":"49cdd052d844a5a72f1fbf202e45a110","url":"assets/images/confirm_btn.png"},{"revision":"be1179731ffd93b2287114c90e64f65d","url":"assets/images/confirm_btn.webp"},{"revision":"862d49036360e77e5086a4c1e1a5b12b","url":"assets/images/drag11.png"},{"revision":"ce98c9e785191b4b5dec43d9c42a1943","url":"assets/images/drag12.png"},{"revision":"3242e6a9486af3aa13d11fc56aa396a5","url":"assets/images/drag13.png"},{"revision":"6577a2f8480fd3c9e5907aad8078367c","url":"assets/images/drag14.png"},{"revision":"b653a7ca1a76b27b9f648b2595997691","url":"assets/images/eat11.png"},{"revision":"c48c407dcd6d835af787f78676125925","url":"assets/images/eat12.png"},{"revision":"eccaa95cdb97eda5fa1c019f18d616cc","url":"assets/images/eat13.png"},{"revision":"83a2679d95f81b6c55597b68a178c611","url":"assets/images/eat14.png"},{"revision":"34660bc9a2ac6065804aa1a68e80fc3b","url":"assets/images/favicon.png"},{"revision":"48d57fc669287060fa6d0955dfb8d257","url":"assets/images/fence_v01.png"},{"revision":"08c13cf2d001c34a061bc50569aa9a70","url":"assets/images/fence_v01.webp"},{"revision":"a267e28cb011391c1df9d59f8f2b5795","url":"assets/images/FG_a_v01.png"},{"revision":"d6ac191de224ec4be62cd9b639b17e9e","url":"assets/images/ftm_bonus_level_monsters.png"},{"revision":"885ce7b3e969576b7b627e657cd9515f","url":"assets/images/great_01.png"},{"revision":"88191ea3184553a3c61342be81a3de4e","url":"assets/images/happy11.png"},{"revision":"a4d0ffff34fa52231965cedff12b7719","url":"assets/images/happy12.png"},{"revision":"110844874baac6a2ba2b814e11f46a2a","url":"assets/images/happy13.png"},{"revision":"f9e96cc182dc3d2b4df737eff3f6b75f","url":"assets/images/happy14.png"},{"revision":"0ab4538bcfd8f9ed476513dedfc4758a","url":"assets/images/hill_v01.png"},{"revision":"f26e48eebd92015148bad21d0f00397c","url":"assets/images/hill_v01.webp"},{"revision":"b8e4926547b8f91bf991ba9d202bf97f","url":"assets/images/hill.webp"},{"revision":"63beece149302bc8ce50401afb098811","url":"assets/images/idle11.png"},{"revision":"1347d43e37481de1101b574ed3892fe6","url":"assets/images/idle12.png"},{"revision":"c9885ccbfd7600374a41dea8605b216f","url":"assets/images/idle13.png"},{"revision":"31d4bea6474f82d2939d48e319e27337","url":"assets/images/idle14.png"},{"revision":"d3316f6e45930df8cdb01f0dbe2aa26c","url":"assets/images/idle4.png"},{"revision":"a7468b94a4a45f089c49ce0b894d1a0e","url":"assets/images/levels_v01.png"},{"revision":"f9c7262c8e44c42c49efecb3687a46a0","url":"assets/images/levels_v01.webp"},{"revision":"38e43cd7b492b624fc3da67dea7b0433","url":"assets/images/loadingImg.gif"},{"revision":"b5fe8b7fc02c5c7dac2a7a27f9779ab2","url":"assets/images/map_btn.png"},{"revision":"fdf67ed5429a16f787a5cec5d6b25d0a","url":"assets/images/map_btn.webp"},{"revision":"1e1b92917545e87ccf9fb8faa7d02044","url":"assets/images/map_icon_monster_level_v01.png"},{"revision":"e708d01e8794e06d918c1408e69feff5","url":"assets/images/map_icon_monster_level_v01.webp"},{"revision":"426d623c79ec3526eae92a56092b2220","url":"assets/images/map.jpg"},{"revision":"76f43b471d06617a870d3334cc555aa4","url":"assets/images/map.webp"},{"revision":"74c001286f2df47d9be71f85799da028","url":"assets/images/mapIcon.png"},{"revision":"d6ee4e553124d0746460e54ec2f540d5","url":"assets/images/mapIcon.webp"},{"revision":"c312ed45360c23d5302c7eca60acaf2d","url":"assets/images/mapLock.png"},{"revision":"aadabeedb05b52faeddeae142e84505c","url":"assets/images/mapLock.webp"},{"revision":"1c55255523850f041717e1698d6696d8","url":"assets/images/next_btn.png"},{"revision":"31378e5bd67b834a8433ba143ede5320","url":"assets/images/next_btn.webp"},{"revision":"8b779c7507a2d179dbddd9bb0979467b","url":"assets/images/output-onlinepngtools.png"},{"revision":"b87dad233d04f0b40641b959b438377e","url":"assets/images/pause_v01.png"},{"revision":"d528ae79e7e33a9f19942e698cf5a4c7","url":"assets/images/pause_v01.webp"},{"revision":"9fa6a44fc1fd8fe7a29685449151fe35","url":"assets/images/pinStar1.png"},{"revision":"b3e93c218a926b91b4bc8ab02ad46621","url":"assets/images/pinStar1.webp"},{"revision":"fb71b601378213dba8c1093efc8fbc0f","url":"assets/images/pinStar2.png"},{"revision":"bbc6723de51855b93626632611884c7b","url":"assets/images/pinStar2.webp"},{"revision":"02644516a381dce3b2372c5c36222278","url":"assets/images/pinStar3.png"},{"revision":"d1bfb9edb3c6f4c0dd8b46975064e44c","url":"assets/images/pinStar3.webp"},{"revision":"a8d1a644d1120069ae6cb93ec9a186f0","url":"assets/images/Play_button.png"},{"revision":"3a62dd938efdb92f41d17b7bf24c5175","url":"assets/images/Play_button.webp"},{"revision":"785f7eb9898630eb470bbd4cdb9ee6ca","url":"assets/images/popup_bg_v01.png"},{"revision":"763725e37f24f7662649f1636067e765","url":"assets/images/popup_bg_v01.webp"},{"revision":"07208f75d6caa1e1dddf65d7d3dd5088","url":"assets/images/promptPlayButton.png"},{"revision":"618714f510d475a8f1e66e62cccfb874","url":"assets/images/promptPlayButton.webp"},{"revision":"2f08e930ba6b1f3618105080615223c3","url":"assets/images/promptTextBg.png"},{"revision":"01a9f2047ff3107785361601e0f5393d","url":"assets/images/promptTextBg.webp"},{"revision":"2ac07f7f2e98a9354e24544d514a7e0f","url":"assets/images/retry_btn.png"},{"revision":"cbcda940c59d8690e451a414da819ad7","url":"assets/images/retry_btn.webp"},{"revision":"e7d070072a84c81493d34fbcb9d56a05","url":"assets/images/sad11.png"},{"revision":"562dd11921b6ef4883f72e0965dbd271","url":"assets/images/sad12.png"},{"revision":"43b013bf5367385326d1f0d1729bde50","url":"assets/images/sad13.png"},{"revision":"a6f030e270350c7d3528887091713904","url":"assets/images/sad14.png"},{"revision":"6736c9d8a52dc1a2d9eb69bdf79d3c96","url":"assets/images/score_v01.png"},{"revision":"82a054d2def94b7313fe16acd1d1aaa1","url":"assets/images/spit11.png"},{"revision":"0208212ec260f5a4a259ccb5c8fe9d85","url":"assets/images/spit12.png"},{"revision":"bd4e366359de6d4c847672ef20b9b5f6","url":"assets/images/spit13.png"},{"revision":"ee6e8131c5146107bd00f74cec3d1954","url":"assets/images/spit14.png"},{"revision":"2f112013306898a438e8734c39b72670","url":"assets/images/spit4.png"},{"revision":"ad3037a2f54a38e25b216512a523f6bc","url":"assets/images/star.png"},{"revision":"3dca5c6ea60282fae30e617f761e131a","url":"assets/images/star.webp"},{"revision":"80e3f39ff0fdd17298b7871fbf7456a2","url":"assets/images/stone_pink_v02.png"},{"revision":"774479bb1885828cdc0d4c5411f4c198","url":"assets/images/stone_pink.png"},{"revision":"a125a16dfe040421e67c7bb41a14f698","url":"assets/images/stone_pink.webp"},{"revision":"b6fd372111f6d3e055474ae36d18643f","url":"assets/images/timer_empty.png"},{"revision":"b2747e7be9a0ee8fb520f6ae017ecba0","url":"assets/images/timer_empty.webp"},{"revision":"7cbd4851bf2afe5220302744f6a9a8b4","url":"assets/images/timer_full.png"},{"revision":"97edf28b5589c5d07294eb1682e629c5","url":"assets/images/timer.png"},{"revision":"19c83925deb7118f084bb1d504e6b55b","url":"assets/images/timer.webp"},{"revision":"6cd26ba4abc76941e7ac9f2cb0c43647","url":"assets/images/Totem_v02_v01.png"},{"revision":"64a325ee680c6b13a4b6864fa08720b6","url":"assets/images/Totem_v02_v01.webp"},{"revision":"8b779c7507a2d179dbddd9bb0979467b","url":"assets/images/tutorial_hand.png"},{"revision":"1f595b4536690a11a733a73563c9974a","url":"assets/images/tutorial_hand.webp"},{"revision":"21f291b8591090e275224e58f6fb83c9","url":"assets/images/WIN_screen_bg.png"},{"revision":"658f5531c9ebe5b76c50588fa7af3c67","url":"assets/images/WIN_screen_bg.webp"},{"revision":"5b985d4b659ec6cb355e76a5429ec9f1","url":"assets/images/Winter_bg_01.jpg"},{"revision":"cb57cbdf0504c38b0ac08890c13a8e8a","url":"assets/images/Winter_bg_01.webp"},{"revision":"3a54f058e2ec8653a0460b690f6fb3ee","url":"assets/images/Winter_fence_v01.png"},{"revision":"fed8afe3c6d3b19c839d9c5211b93b3c","url":"assets/images/Winter_fence_v01.webp"},{"revision":"9aecfbcf79160ce6d50860feda240fdf","url":"assets/images/Winter_FG_v01.png"},{"revision":"ebc37732c9b94482c57b2eda899d6e34","url":"assets/images/Winter_hill_v01.webp"},{"revision":"7610e39767c77cc156fbaa8817a5423b","url":"assets/images/Winter_hill.webp"},{"revision":"7e73ec28dd8b671392dec3831c80ea7e","url":"assets/images/Winter_sign_v01.png"},{"revision":"9cb87e28c648d10bb283b5aa73a05ce8","url":"assets/images/Winter_sign_v01.webp"},{"revision":"72a0674f68d6031cb38266174ebb69f5","url":"assets/monsterrive.riv"},{"revision":"d8e59c9de8956d6e3ec8dc019e25878f","url":"container_app_manifest/dev/web_app_manifest.json"},{"revision":"bf8adefe57522c0a6b3f73a913dc930c","url":"feedTheMonster.js"},{"revision":"817d9907f68af2e64c8576916d8dc122","url":"index.css"},{"revision":"983e5dea036ac951b27c8ee881928cc3","url":"index.html"},{"revision":"b0d433f5b41b717460c677da1994abdd","url":"lang/afrikaans/ftm_afrikaans.json"},{"revision":"4c4b5858befdc1b28ef4c67574beafa4","url":"lang/amharic/ftm_amharic.json"},{"revision":"cc70e1b2cb6071008aaeefed876f8a8a","url":"lang/arabic/ftm_arabic.json"},{"revision":"c1781d5c9d20034e724cfacf0be4913a","url":"lang/australianenglish/ftm_australianenglish.json"},{"revision":"17e184abfad696f749359fbb5a870ffc","url":"lang/azerbaijani/ftm_azerbaijani.json"},{"revision":"cb3f63fd702774f17c24452771fec0b2","url":"lang/bangla/ftm_bangla.json"},{"revision":"aed23e95dfa9e50748e0967ee1466760","url":"lang/brazilianportuguese/ftm_brazilianportuguese.json"},{"revision":"978c4419eea62b23e233f87ea6e30ea6","url":"lang/caboverdecreole/ftm_caboverdecreole.json"},{"revision":"7bdd02da4f57311a23275230df9dde27","url":"lang/caboverdeportuguese/ftm_caboverdeportuguese.json"},{"revision":"30dc47676d62c7950a59aa052197b1b9","url":"lang/english/ftm_english.json"},{"revision":"949500ee0784e647f7630659bc19947c","url":"lang/englishwestafrican/ftm_englishwestafrican.json"},{"revision":"6f0e1b6446c69287d3a8311f94af4b90","url":"lang/farsi/ftm_farsi.json"},{"revision":"019f1e4acdb21d38ff5e1f347d75060a","url":"lang/french/ftm_french.json"},{"revision":"7690f722ab29c00aafd999808cf17fb0","url":"lang/georgian/ftm_georgian.json"},{"revision":"a0be319ed5d6358ec7f78681525644c3","url":"lang/haitiancreole/ftm_haitiancreole.json"},{"revision":"a0743f849fe83ad641b88bde6a5b298e","url":"lang/hausa/ftm_hausa.json"},{"revision":"bd9103fe2d0bcddebcbc4c98b9d3d599","url":"lang/hindi/ftm_hindi.json"},{"revision":"d8d6f048fbb7f64e619df617a63b7f4c","url":"lang/igbo/ftm_igbo.json"},{"revision":"043cbae6caf9925f03ccacbae59ed79e","url":"lang/indianenglish/ftm_indianenglish.json"},{"revision":"5dd1a29383def5bd4a2ba88d2bfb55f1","url":"lang/isixhosa/ftm_isixhosa.json"},{"revision":"3e615bc55be027e66c1a848ad92e1a5b","url":"lang/javanese/ftm_javanese.json"},{"revision":"b9139d28b3a4f6c85e5e6b98f5898451","url":"lang/kinyarwanda/ftm_kinyarwanda.json"},{"revision":"e45567e9278bbe337f8e2f66eb1ebdee","url":"lang/kirundi/ftm_kirundi.json"},{"revision":"c371f09d63235f38a6a0cf98b6b0d44b","url":"lang/kurdish/ftm_kurdish.json"},{"revision":"dea6bc87764fc8f6e5e6e91830518dfb","url":"lang/lugandan/ftm_lugandan.json"},{"revision":"1627f7cbc4027107f60d07405cd6eca4","url":"lang/malay/ftm_malay.json"},{"revision":"8454f89feb41354347eb7afc1e549f11","url":"lang/malgache/ftm_malgache.json"},{"revision":"36ab849243de47956a96445344be02cc","url":"lang/marathi/ftm_marathi.json"},{"revision":"ccce1962f187dbd80ef2c4354c456d2f","url":"lang/ndebele/ftm_ndebele.json"},{"revision":"e576907c034c9adaaf59d7379fc9a4d8","url":"lang/nepali/ftm_nepali.json"},{"revision":"893beac1c67a02854d1b9b2e8142ba58","url":"lang/oromo/ftm_oromo.json"},{"revision":"3aefbaa7f5f2d999a226c296034e11f6","url":"lang/pashto/ftm_pashto.json"},{"revision":"813a6373f620c2fa17e8e62c9ad274f6","url":"lang/punjabi/ftm_punjabi.json"},{"revision":"26d4abd82ba43b8f0ca4f66974b217a0","url":"lang/sepedi/ftm_sepedi.json"},{"revision":"ff39a3c7a56ba4b393eb1aedcee07090","url":"lang/sesotho/ftm_sesotho.json"},{"revision":"47a125727a4fc4fdb4099ebc5a2e2807","url":"lang/shona/ftm_shona.json"},{"revision":"601558517df609a69bcc83524f2fe6bd","url":"lang/siswati/ftm_siswati.json"},{"revision":"03d335e76e656287797f01d813f71664","url":"lang/somali/ftm_somali.json"},{"revision":"ef6ec6cf2175ca7fc02444551fa9d5ec","url":"lang/southafricanenglish/ftm_southafricanenglish.json"},{"revision":"f1ebfe0def7be2d5f47175977f7100b3","url":"lang/spanish/ftm_spanish.json"},{"revision":"0013a49c9c1bd84ddb18b2d4bd316270","url":"lang/swahili/ftm_swahili.json"},{"revision":"35f9e44840a9eec78b20536449d0434d","url":"lang/tagalog/ftm_tagalog.json"},{"revision":"4084827d1213bd6f9285e80216ef24e3","url":"lang/tajik/ftm_tajik.json"},{"revision":"dcdc2ea95d6af569acdd5735058a3cc6","url":"lang/thai/ftm_thai.json"},{"revision":"3c51b75c0609ff0776f968176ba5beaa","url":"lang/tigragna/ftm_tigragna.json"},{"revision":"c4f14ba8ec9dd2c1fbed5ce71e71281b","url":"lang/tsonga/ftm_tsonga.json"},{"revision":"18f5f80c6b21babd863c869474fb9cf3","url":"lang/tswana/ftm_tswana.json"},{"revision":"c74eea9181e7d2ccdb7b72b712ecf06e","url":"lang/turkish/ftm_turkish.json"},{"revision":"6b00e8842dd95d843cfa27a547821b81","url":"lang/twi/ftm_twi.json"},{"revision":"1e15e5c087b7adca9347b31eefd7d45d","url":"lang/ukrainian/ftm_ukrainian.json"},{"revision":"c3cec59e7ae85123ff3684942f1ccc9a","url":"lang/venda/ftm_venda.json"},{"revision":"cae50f38ba765eee32b0932adc8da1a0","url":"lang/vietnamese/ftm_vietnamese.json"},{"revision":"5633a1c513e1a55aa51d01346a5933cb","url":"lang/wolof/ftm_wolof.json"},{"revision":"be588abbc6c7a5f5381f35de80e8115d","url":"lang/yoruba/ftm_yoruba.json"},{"revision":"8c3277d7fc9759623c9d3506b1ebe088","url":"lang/zulu/ftm_zulu.json"},{"revision":"247251908bf262d3280dcaf20c276478","url":"manifest.json"},{"revision":"ae797974ddb3e3332e4e4aa403364538","url":"workers/feedback-text-worker.js"}], {
  ignoreURLParametersMatching: [/^cr_/],
  exclude: [/^lang\//],
});
var number = 0;
var version = 1.26;
// self.addEventListener('activate', function(e) {
//     console.log("activated");
//
// });

self.addEventListener("install", async function (e) {
  self.skipWaiting();
  e.waitUntil(preloadAdditionalAssets()); // Preload specific assets during the install event
});
const channel = new BroadcastChannel("my-channel");
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
channel.addEventListener("message", async function (event) {
  if (event.data.command === "Cache") {
    number = 0;
    await getCacheName(event.data.data);
  }
  if (event.data.command === "CacheUpdate") {
    caches.delete(workbox.core.cacheNames.precache + event.data.data);
    await getCacheName(event.data.data);
  }
});

self.registration.addEventListener("updatefound", function (e) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      if (cacheName == workbox.core.cacheNames.precache) {
        // caches.delete(cacheName);
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ msg: "Update Found" })
          );
        });
      }
    });
  });
});

// Preload additional assets
async function preloadAdditionalAssets() {
  const assetsToCache = [
    "../public/assets/monsterrive.riv", // Additional Rive asset
  ];
  const cache = await caches.open("dynamic-cache");

  try {
    await Promise.all(
      assetsToCache.map(async (url) => {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log("Cached additional asset:", url);
        } else {
          console.error("Failed to fetch additional asset:", url);
        }
      })
    );
    console.log("All additional assets preloaded successfully.");
  } catch (error) {
    console.error("Error preloading additional assets:", error);
  }
}

async function cacheLangAssets(file, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(file);

  if (!cachedResponse) {
    await cache.add(file);
    console.log('Cached File:', file);
  } else {
    console.log('File already cached, skipping:', file);
  }
}
async function getCacheName(language) {
  await caches.keys().then((cacheNames) => {
    cacheNames.forEach(async (cacheName) => {
      await getALLAudioUrls(cacheName, language);
    });
  });
}

async function getALLAudioUrls(cacheName, language) {
  let audioList = new Set(); // Use Set to filter duplicates
  audioList.add(`/lang/${language}/ftm_${language}.json`);
  fetch(`./lang/${language}/ftm_${language}.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) =>
    res.json().then(async (data) => {
      await cacheFeedBackAudio(data.FeedbackAudios, language);

      for (const level of data.Levels) {
        for (const puzzle of level.Puzzles) {
          let file = puzzle.prompt.PromptAudio;
          audioList.add(
            self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
              ? file.slice(0, file.indexOf("/feedthemonster") + "/feedthemonster".length) +
                "dev" + file.slice(file.indexOf("/feedthemonster") + "/feedthemonster".length)
              : file
          );
        }
      }
      cacheAudiosFiles(Array.from(audioList), language); // Convert Set back to array
    })
  );
}

async function cacheAudiosFiles(audioList, language) {
  const uniqueAudioURLs = [...new Set(audioList)]; // Ensuring the audioList has only unique values
  const percentageInterval = 10;
  const partSize = Math.ceil(uniqueAudioURLs.length / percentageInterval);
  const delayBetweenRequests = 800;
  const timeoutMultiplier = 0.6; // Adjust multiplier based on device performance
  const timeoutValue = 3000; // Adjust timeout value as needed (in milliseconds)

  for (let i = 0; i < percentageInterval; i++) {
    const startIndex = i * partSize;
    let endIndex = startIndex + partSize;
    if (i == percentageInterval - 1) {
      endIndex = uniqueAudioURLs.length;
    }
    const part = uniqueAudioURLs.slice(startIndex, endIndex);

    try {
      const cache = await caches.open(language);
      const timeoutPromises = part.map(async (url) => {
        try {
          const timeoutPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              clearTimeout(timeoutId);
              reject(new Error("Timeout while caching audio: " + url));
            }, timeoutValue * timeoutMultiplier);
          });
          console.log('Cached Audio files:', url);
          return Promise.race([timeoutPromise, cache.add(url)]);
        } catch (error) {
          console.error('Error caching audio:', url, error);
        }
      });

      await Promise.all(timeoutPromises);
    } catch (error) {
      console.error('Could not add audios:', error);
    } finally {
      await channel.postMessage({
        msg: "Loading",
        data: Math.min((i + 1) * percentageInterval, 100),
      });
    }

    await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
  }
}


async function cacheCommonAssets(language) {
  const assetUrls = [
    `./lang/${language}/audios/fantastic.WAV`,
    `./lang/${language}/audios/great.wav`,
    `./lang/${language}/images/fantastic_01.png`,
    `./lang/${language}/images/great_01.png`,
    `./lang/${language}/images/title.png`,
  ];

  const timeoutMultiplier = 1; // Adjust multiplier based on device performance
  const timeoutValue = 4000; // Adjust timeout value as needed (in milliseconds)

  try {
    const cacheName = language;
    const cache = await caches.open(cacheName);

    const timeoutPromises = assetUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Timeout while caching audio: " + url));
        }, timeoutValue * timeoutMultiplier);
        console.log('Cached Asset:', url);
        cache.add(url)
          .then(() => {
            clearTimeout(timeoutId);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    });

    await Promise.all(timeoutPromises);
  } catch (e) {
    console.log('Could not open cache:', e);
  }
}

async function cacheFeedBackAudio(feedBackAudios, language) {
  const audioUrls = [...new Set(feedBackAudios.map(audio => {
    return self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
      ? audio.replace("/feedthemonster", "/feedthemonsterdev")
      : audio;
  }))];

  const timeoutMultiplier = 0.6; // Adjust multiplier based on device performance
  const timeoutValue = 3000; // Adjust timeout value as needed (in milliseconds)

  try {
    const cacheName =  language;
    const cache = await caches.open(cacheName);

    await Promise.all(audioUrls.map(async (url) => {
      try {
        const timeoutPromise = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            reject(new Error("Timeout while caching audio: " + url));
          }, timeoutValue * timeoutMultiplier);
        });

        await Promise.race([timeoutPromise, cache.add(url)]);
        console.log('Cached Feedback audio:', url);
      } catch (e) {
        console.log('Error caching audio:', url, e);
      }
    }));
  } catch (e) {
    console.log('Could not open cache:', e);
  }
}


self.addEventListener("fetch", function (event) {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.searchParams.has('cache-bust')) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

