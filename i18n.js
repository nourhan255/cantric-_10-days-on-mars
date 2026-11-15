// English <-> Arabic switch for the whole game (isolated module). The game code keeps writing English; this layer translates the
// text that appears on screen (phrase dictionary + a MutationObserver) and flips the page direction. Press the button at the top: العربية / English.
// Lines are "English ||| Arabic". {N} = the astronaut's name. Phrases are replaced longest-first, so a sentence beats the words inside it.
const RAW = `
Skip ||| تخطي
Loading… ||| جارٍ التحميل…
Mars clock (Jezero) ||| ساعة المريخ (جيزيرو)
Earth clock (Cairo) ||| ساعة الأرض (القاهرة)
Day 1 · Hard Landing ||| اليوم 1 · هبوط صعب
Day 1 of 10 · Hard Landing ||| اليوم 1 من 10 · هبوط صعب
Day 1: Hard Landing ||| اليوم 1: هبوط صعب
Radiation inside the base ||| الإشعاع داخل القاعدة
Strong radiation event detected. ||| تم رصد حدث إشعاعي قوي.
The rover's radiation detector shows that radiation outside is rising fast. The base needs radiation protection. ||| جهاز الإشعاع في الروفر يُظهر أن الإشعاع في الخارج يرتفع بسرعة. القاعدة تحتاج إلى حماية من الإشعاع.
This is a different hazard from the dust storm: the dust storm hides the Sun, while the radiation event is made of fast particles from the Sun. It really happened: on 20 May 2024 a solar storm raised the radiation near the Curiosity rover to 8,100 micrograys, about 30 chest X-rays. ||| هذا خطر مختلف عن عاصفة الغبار: عاصفة الغبار تحجب الشمس، أما الحدث الإشعاعي فهو جسيمات سريعة قادمة من الشمس. وقد حدث فعلاً: في 20 مايو 2024 رفعت عاصفة شمسية الإشعاع بالقرب من الروفر كيوريوسيتي إلى 8,100 ميكروغراي، أي نحو 30 أشعة سينية للصدر.
Protection: ||| الحماية:
On Mars, ||| على المريخ،
one full day ||| مرّ يوم كامل
passed. On Earth, ||| . وعلى الأرض،
passed. ||| .
What we learned today: ||| ماذا تعلّمنا اليوم:
HDPE (polyethylene) shields from solar radiation better than metals because it contains a lot of hydrogen. The dust storm and the radiation event were two different hazards. ||| البولي إيثيلين (HDPE) يحمي من الإشعاع الشمسي أفضل من المعادن لأنه يحتوي على الكثير من الهيدروجين. وعاصفة الغبار والحدث الإشعاعي كانا خطرين مختلفين.
Day 2: coming soon ||| اليوم 2: قريبًا
Play again ||| العب مرة أخرى
Tap or click the floor ||| المس الأرض أو اضغط عليها
to walk there · ||| لتمشي إليها ·
tap a glowing thing ||| المس أي شيء متوهج
to use it · drag to look around · ||| لتستخدمه · اسحب لتنظر حولك ·
ask ORBI for help · ||| اسأل أوربي عن مساعدة ·
skip a cutscene ||| تخطَّ المشهد
Continue saved mission ||| أكمل المهمة المحفوظة
Something went wrong ||| حدث خطأ ما
Lead panel ||| لوح الرصاص
Weak ||| ضعيف
Lead is very heavy. When particles from the Sun hit it, it gives off secondary radiation inside the base. ||| الرصاص ثقيل جدًا. عندما تصطدم به جسيمات الشمس يُصدر إشعاعًا ثانويًا داخل القاعدة.
Not this one. Lead is too heavy. There is something lighter and better. ||| ليس هذا. الرصاص ثقيل جدًا. هناك شيء أخف وأفضل.
Aluminium panel ||| لوح الألومنيوم
Not enough ||| غير كافٍ
Aluminium stops some of the particles, but not enough. The base walls are already made of metal. ||| الألومنيوم يوقف بعض الجسيمات لكن ليس بما يكفي. وجدران القاعدة مصنوعة من المعدن أصلًا.
Getting closer! But the answer is not another metal. Look for something with lots of hydrogen. ||| اقتربت! لكن الجواب ليس معدنًا آخر. ابحث عن شيء فيه الكثير من الهيدروجين.
Strong ||| قوي
That is it! Take the panels and install them on the outside wall of the base. ||| هذا هو! خذ الألواح وركّبها على الجدار الخارجي للقاعدة.
NASA: Curiosity RAD, the solar storm of 20 May 2024 ||| ناسا: جهاز RAD في كيوريوسيتي، العاصفة الشمسية في 20 مايو 2024
On the way to Mars ||| في الطريق إلى المريخ
Check the rover ||| افحص الروفر
Enter the base ||| ادخل القاعدة
Test the panels on the test machine ||| اختبر الألواح على جهاز الاختبار
Take the HDPE panels and install them on the outside wall by the door ||| خذ ألواح HDPE وركّبها على الجدار الخارجي بجانب الباب
Go back inside the base ||| ارجع إلى داخل القاعدة
Follow ORBI to the base ||| اتبع أوربي إلى القاعدة
Stay close to ORBI ||| ابقَ قريبًا من أوربي
Explore the base · ||| استكشف القاعدة ·
Incoming message from the rover… ||| رسالة واردة من الروفر…
Click: check the rover ||| اضغط: افحص الروفر
Click: talk to ORBI ||| اضغط: تحدث مع أوربي
Empty ||| فارغ
· click: take a panel ||| · اضغط: خذ لوحًا
Click: test the ||| اضغط: اختبر
Panel test machine: bring a panel ||| جهاز اختبار الألواح: ضع لوحًا
Installed ||| تم التركيب
Click: install an HDPE panel ||| اضغط: ركّب لوح HDPE
Shield panel spot ||| مكان لوح الحماية
Panel put back. ||| أعدت اللوح مكانه.
Let us finish exploring first, Toby! ||| دعنا ننهي الاستكشاف أولًا يا {N}!
Not yet, Toby. Let us follow the story first. ||| ليس بعد يا {N}. لنتبع القصة أولًا.
Your hands are full. Press Q to put the panel back. ||| يداك مشغولتان. اضغط Q لإعادة اللوح.
You have 3 HDPE panels. Go outside and install them on the base wall next to the door. ||| معك 3 ألواح HDPE. اخرج وركّبها على جدار القاعدة بجانب الباب.
The rover is far away in the dust storm. Follow ORBI to the base first. ||| الروفر بعيد في عاصفة الغبار. اتبع أوربي إلى القاعدة أولًا.
The rover will call us soon. Keep exploring! ||| الروفر سيتصل بنا قريبًا. واصل الاستكشاف!
The rover is still measuring strong radiation outside. ||| الروفر ما زال يقيس إشعاعًا قويًا في الخارج.
Rover ||| الروفر
Message from the Rover ||| رسالة من الروفر
Understood ||| فهمت
The radiation level is rising! We need shielding. Go to the equipment area, the crates and the test machine, and find the right material. ||| مستوى الإشعاع يرتفع! نحتاج إلى حماية. اذهب إلى منطقة المعدات والصناديق وجهاز الاختبار، وابحث عن المادة المناسبة.
This way, Toby! To the base! ||| من هنا يا {N}! إلى القاعدة!
Look around the base. Something is wrong with the power! ||| انظر حول القاعدة. هناك مشكلة في الكهرباء!
Wait... the rover is calling us! ||| انتظر… الروفر يتصل بنا!
Take a panel from the crates and put it on the test machine over there. ||| خذ لوحًا من الصناديق وضعه على جهاز الاختبار هناك.
Try another material. Think about something light. ||| جرّب مادة أخرى. فكّر في شيء خفيف.
The answer is not a metal. Look for something with lots of hydrogen. ||| الجواب ليس معدنًا. ابحث عن شيء فيه الكثير من الهيدروجين.
The wall next to the door, on the outside. Install the 3 panels there. ||| الجدار بجانب الباب من الخارج. ركّب الألواح الثلاثة هناك.
The shield is up and the warning has stopped. Come back inside, Toby! ||| الدرع جاهز والتحذير توقف. ارجع إلى الداخل يا {N}!
Radiation inside is lower. Good work! ||| الإشعاع في الداخل أقل. عمل رائع!
Take a panel from the crates and put it here. ||| خذ لوحًا من الصناديق وضعه هنا.
Test result: ||| نتيجة الاختبار:
Let us install it ||| لنركّبه
I will try again ||| سأحاول مرة أخرى
HDPE it is! Take the 3 HDPE panels from the crate and install them on the outside wall of the base. ||| إنه HDPE! خذ ألواح HDPE الثلاثة من الصندوق وركّبها على الجدار الخارجي للقاعدة.
You need HDPE panels. They are in the crate inside the base. ||| تحتاج إلى ألواح HDPE. هي في الصندوق داخل القاعدة.
Another panel. ||| لوح آخر.
Shield complete! The radiation warning has stopped. Come back inside, Toby! ||| اكتمل الدرع! توقف تحذير الإشعاع. ارجع إلى الداخل يا {N}!
After 203 days in space, our ship reaches Mars... but a dust storm hits during the landing! ||| بعد 203 أيام في الفضاء، وصلت سفينتنا إلى المريخ… لكن عاصفة غبار ضربتنا أثناء الهبوط!
Toby: "Whoa! That was a hard landing! The spaceship is broken!" ||| {N}: "واو! كان هبوطًا صعبًا! السفينة تضررت!"
ORBI: "Toby! Are you okay? We survived the landing, but the Mars base is in trouble. Come with me!" ||| أوربي: "{N}! هل أنت بخير؟ نجونا من الهبوط، لكن قاعدة المريخ في مشكلة. تعال معي!"
ORBI: "Uh-oh! My sensors found a PROBLEM: a RADIATION ALERT! Follow me to the base, quickly!" ||| أوربي: "أوه! حساساتي وجدت مشكلة: تنبيه إشعاع! اتبعني إلى القاعدة بسرعة!"
ORBI: "Oh no, the base door is locked! The crash cut its power. Let me open it by hand!" ||| أوربي: "يا للهول، باب القاعدة مغلق! الاصطدام قطع الكهرباء عنه. دعني أفتحه بيدي!"
*CLUNK* ... The door is open! ||| *طَقّ* … الباب مفتوح!
ORBI: "Quick, inside!" ||| أوربي: "بسرعة، إلى الداخل!"
ORBI: "Toby, we have an ELECTRICITY problem! The crash damaged a power cable. If the power fails, the whole base could shut down, and that would be dangerous for us!" ||| أوربي: "يا {N}، عندنا مشكلة في الكهرباء! الاصطدام أتلف كابل الطاقة. لو انقطعت الكهرباء قد تتوقف القاعدة كلها، وهذا خطر علينا!"
ORBI: "We must find out what is happening outside. Your helmet goes on when we step out. Let's explore!" ||| أوربي: "يجب أن نعرف ما يحدث في الخارج. ستلبس خوذتك عندما نخرج. هيا نستكشف!"
ORBI: "Excellent, Toby! You solved the challenge and protected our base. You're a real astronaut!" ||| أوربي: "ممتاز يا {N}! حللت التحدي وحميت قاعدتنا. أنت رائد فضاء حقيقي!"
MISSION COMPLETE! The radiation warning is over, and the dust storm is fading. ||| اكتملت المهمة! انتهى تحذير الإشعاع وعاصفة الغبار تهدأ.
Continue to Sol 2 ||| تابع إلى السول 2
Follow me, Toby! The base is straight ahead. ||| اتبعني يا {N}! القاعدة أمامنا مباشرة.
EMERGENCY POWER WARNING: main power is unstable. ||| تحذير طاقة طارئ: الكهرباء الرئيسية غير مستقرة.
⚠ BASE ALERT ||| ⚠ تنبيه القاعدة
ORBI! The lights are getting weaker! What is happening? ||| أوربي! الأضواء تضعف! ماذا يحدث؟
Let us explore the base and find out what is wrong! ||| لنستكشف القاعدة ونعرف ما المشكلة!
Time is up! Let us contact the rover. It may know what is going on. ||| انتهى الوقت! لنتصل بالروفر. ربما يعرف ما يحدث.
Mission computer ||| حاسوب المهمة
Communication antenna on the rover ||| هوائي الاتصال على الروفر
Radiation shield panel ||| لوح درع الإشعاع
Hydroponic tray ||| صينية الزراعة المائية
Reflective blankets ||| البطانيات العاكسة
Spare panel crate ||| صندوق الألواح الاحتياطية
Spacesuit locker ||| خزانة بدلة الفضاء
Tall tank ||| الخزان الطويل
Small tank ||| الخزان الصغير
Shelf ||| الرف
Sleeping pod ||| كبسولة النوم
West window ||| النافذة الغربية
East windows ||| النوافذ الشرقية
Solar panel ||| لوح شمسي
base door ||| باب القاعدة
Helmet ON: there is no air outside! ||| الخوذة مفعّلة: لا يوجد هواء في الخارج!
Helmet OFF: the air inside is safe. ||| الخوذة مطفأة: الهواء في الداخل آمن.
Next: ||| التالي:
new objective ||| هدف جديد
That is everything for today! Let us rest in the sleeping pod, so the habitat can run through the night. ||| هذا كل شيء اليوم! لنرتح في كبسولة النوم لتعمل القاعدة طوال الليل.
Rest in the sleeping pod to end the Sol ||| ارتح في كبسولة النوم لإنهاء السول
The sleeping pods are along the south wall inside the base. ||| كبسولات النوم على طول الجدار الجنوبي داخل القاعدة.
Look for the glowing pod. ||| ابحث عن الكبسولة المتوهجة.
Tap a glowing sleeping pod. ||| المس كبسولة نوم متوهجة.
Later ||| لاحقًا
☢ RADIATION ALERT! ||| ☢ تنبيه إشعاع!
A big burst from the Sun is coming! ||| انفجار كبير من الشمس قادم!
What is radiation? ||| ما هو الإشعاع؟
Invisible energy from the Sun. ||| طاقة غير مرئية من الشمس.
A little is OK. A big burst can hurt people. ||| القليل منه لا بأس به. أما الانفجار الكبير فقد يؤذي الناس.
Our plan ||| خطتنا
Put a ||| ضع
SHIELD ||| درعًا
on the wall to block it. ||| على الجدار ليوقفه.
Go fast! ||| أسرع!
The power cable is a different problem. ||| كابل الكهرباء مشكلة مختلفة.
Real NASA data ||| بيانات ناسا الحقيقية
Let us go! ||| هيا بنا!
Quick, Toby! Back to the base, take the shield panels from the white crate! ||| بسرعة يا {N}! إلى القاعدة، خذ ألواح الدرع من الصندوق الأبيض!
Follow ORBI to the base door ||| اتبع أوربي إلى باب القاعدة
ORBI ran to the base door. Follow him! ||| أوربي ركض إلى باب القاعدة. اتبعه!
The glowing circle on the ground is next to the base door. ||| الدائرة المتوهجة على الأرض بجانب باب القاعدة.
Tap the floor next to the glowing circle to walk there. ||| المس الأرض بجانب الدائرة المتوهجة لتمشي إليها.
Something is beeping outside. It is the rover! ||| شيء يصفّر في الخارج. إنه الروفر!
The rover is outside, south of the base. Look for the glowing rover. ||| الروفر في الخارج جنوب القاعدة. ابحث عن الروفر المتوهج.
Tap the glowing rover to read its message. ||| المس الروفر المتوهج لتقرأ رسالته.
Rover: tap to read its message ||| الروفر: المس لقراءة رسالته
Take the shield panels from the white crate ||| خذ ألواح الدرع من الصندوق الأبيض
Shields stop radiation. They are in a crate inside the base. ||| الدروع توقف الإشعاع. هي في صندوق داخل القاعدة.
The glowing crate has the white shield panels. ||| الصندوق المتوهج فيه ألواح الدرع البيضاء.
Tap the glowing white crate. ||| المس الصندوق الأبيض المتوهج.
These panels are made of polyethylene, a special plastic with lots of hydrogen. It blocks radiation very well! Put them on the wall outside, quick! ||| هذه الألواح من البولي إيثيلين، بلاستيك خاص فيه الكثير من الهيدروجين. يوقف الإشعاع جيدًا! ضعها على الجدار الخارجي بسرعة!
White crate: tap to take the 3 shield panels ||| الصندوق الأبيض: المس لتأخذ ألواح الدرع الثلاثة
Put the 3 shield panels on the glowing wall spots ||| ضع ألواح الدرع الثلاثة على أماكن الجدار المتوهجة
The shield goes on the OUTSIDE wall of the base, by the door. ||| الدرع يوضع على الجدار الخارجي للقاعدة بجانب الباب.
Three glowing spots are on the wall outside. Go there. ||| ثلاثة أماكن متوهجة على الجدار الخارجي. اذهب إليها.
Tap a glowing spot to put a shield panel on it. ||| المس مكانًا متوهجًا لتضع عليه لوح درع.
The shield is done! Go back to the base. ||| الدرع جاهز! ارجع إلى القاعدة.
The glowing circle is at the door. ||| الدائرة المتوهجة عند الباب.
Walk through the door. ||| امشِ عبر الباب.
Go outside and look at the solar panels ||| اخرج وانظر إلى الألواح الشمسية
The storm is weaker, but our power is still low. Why? ||| العاصفة أضعف لكن الطاقة ما زالت قليلة. لماذا؟
The solar panels are east of the base. Go and look at them. ||| الألواح الشمسية شرق القاعدة. اذهب وانظر إليها.
Tap the floor near the glowing solar panel. ||| المس الأرض قرب اللوح الشمسي المتوهج.
Look, Toby! The panels are covered in dust. They look dull, so they make less power! ||| انظر يا {N}! الألواح مغطاة بالغبار. تبدو باهتة، فتنتج طاقة أقل!
Hop into the rover. It has a cleaning brush! ||| اركب الروفر. فيه فرشاة تنظيف!
The rover has a big brush on its front. ||| للروفر فرشاة كبيرة في مقدمته.
The rover is south of the base. It is glowing. ||| الروفر جنوب القاعدة. إنه متوهج.
Tap the glowing rover to hop in. ||| المس الروفر المتوهج لتركبه.
Rover: tap to hop in ||| الروفر: المس لتركب
Drive the rover over each dusty panel ||| قُد الروفر فوق كل لوح مغبّر
Tap a dusty panel and the rover drives there and brushes it. ||| المس لوحًا مغبّرًا وسيذهب الروفر إليه وينظّفه.
Look for the glowing panels. Tap one. ||| ابحث عن الألواح المتوهجة. المس واحدًا.
Tap a glowing panel. You have 60 seconds for all three. ||| المس لوحًا متوهجًا. عندك 60 ثانية للألواح الثلاثة.
Check the water level on the computer ||| افحص مستوى الماء على الحاسوب
The water tanks are draining faster than normal. Where can we see numbers? ||| خزانات الماء تفرغ أسرع من المعتاد. أين نرى الأرقام؟
The mission computer shows the tanks. ||| حاسوب المهمة يعرض الخزانات.
Tap the glowing computer. ||| المس الحاسوب المتوهج.
Water tanks ||| خزانات الماء
Water is dropping fast. Something is leaking! ||| الماء ينقص بسرعة. هناك تسريب!
Water used by the crew goes down slowly. A leak makes it drop much faster, and it keeps dropping until we fix it. ||| الماء الذي يستهلكه الطاقم ينقص ببطء. أما التسريب فيجعله ينقص أسرع بكثير ويستمر حتى نصلحه.
Find the leak: inspect the pipes ||| اعثر على التسريب: افحص الأنابيب
Leaks leave wet marks. Check each pipe section near the tanks. ||| التسريب يترك علامات مبللة. افحص كل جزء من الأنابيب قرب الخزانات.
Three pipe sections are glowing. Check them one by one. ||| ثلاثة أجزاء من الأنابيب متوهجة. افحصها واحدًا واحدًا.
Tap each glowing pipe section until you find the wet one. ||| المس كل جزء متوهج حتى تجد الجزء المبلل.
Pipe section: WET! ||| جزء الأنبوب: مبلل!
Found it! Water is leaking here. ||| وجدته! الماء يتسرب من هنا.
The pipe has a crack. Let us repair it. ||| الأنبوب فيه شق. لنصلحه.
This pipe is dry. Check another one. ||| هذا الأنبوب جاف. افحص آخر.
Pipe section A: click to inspect ||| جزء الأنبوب A: اضغط للفحص
Pipe section B: click to inspect ||| جزء الأنبوب B: اضغط للفحص
Pipe section C: click to inspect ||| جزء الأنبوب C: اضغط للفحص
The cracked pipe needs patching. ||| الأنبوب المشقوق يحتاج إلى ترقيع.
Go back to the wet pipe section and patch it. ||| ارجع إلى الجزء المبلل ورقّعه.
Tap the glowing pipe several times to apply the patch. ||| المس الأنبوب المتوهج عدة مرات لتضع الرقعة.
The patch is on! The leak has stopped. Let us verify it. ||| وُضعت الرقعة! توقف التسريب. لنتأكد.
Patching... ||| جارٍ الترقيع…
Repair ||| الإصلاح
Cracked pipe: tap to patch ||| أنبوب مشقوق: المس للترقيع
Check the computer: has the leak stopped? ||| افحص الحاسوب: هل توقف التسريب؟
Always check that a repair worked. ||| تأكد دائمًا أن الإصلاح نجح.
Look at the tanks on the computer. ||| انظر إلى الخزانات على الحاسوب.
Leak check ||| فحص التسريب
Good news: no more leak! Water is stable. ||| خبر سار: لا تسريب بعد الآن! الماء مستقر.
Switch on water recycling ||| شغّل إعادة تدوير الماء
Now let us save water. The recycler cleans used water so we can drink it again. ||| الآن لنوفّر الماء. جهاز إعادة التدوير ينظّف الماء المستعمل لنشربه مرة أخرى.
The recycler unit is glowing. ||| وحدة إعادة التدوير متوهجة.
Tap the glowing unit to switch it on. ||| المس الوحدة المتوهجة لتشغيلها.
Water recycler ON ||| مُدوِّر الماء يعمل
Used water is cleaned and returned to the tank. ||| الماء المستعمل يُنظَّف ويعود إلى الخزان.
Water recycler: click to switch on ||| مُدوِّر الماء: اضغط للتشغيل
Learn about growing food on Mars ||| تعلّم زراعة الطعام على المريخ
We need fresh food. Let us learn how to grow it here. ||| نحتاج إلى طعام طازج. لنتعلم كيف نزرعه هنا.
The computer has a lesson. ||| الحاسوب فيه درس.
Why not plant in Mars soil? ||| لماذا لا نزرع في تربة المريخ؟
Hydroponics! ||| الزراعة المائية!
Roots grow in ||| الجذور تنمو في
water with nutrients ||| ماء فيه مغذّيات
. No soil needed. ||| . لا حاجة إلى تربة.
Plants need ||| النباتات تحتاج إلى
💧 water · 💡 power · ⏳ time ||| 💧 ماء · 💡 كهرباء · ⏳ وقت
They help a little, but never replace life support. ||| تساعد قليلًا لكنها لا تحل محل أنظمة دعم الحياة.
Let us plant! ||| هيا نزرع!
Prepare water for the tray ||| جهّز الماء للصينية
Hydroponics starts with water. Where is it stored? ||| الزراعة المائية تبدأ بالماء. أين هو مخزّن؟
The tall tank is glowing. ||| الخزان الطويل متوهج.
Tap the glowing tank. ||| المس الخزان المتوهج.
Water collected. It is taken from our tanks, so we must use it wisely. ||| تم جمع الماء. أُخذ من خزاناتنا، فيجب أن نستخدمه بحكمة.
Water tank: click to fill the tray water ||| خزان الماء: اضغط لملء ماء الصينية
Prepare the growing medium ||| جهّز وسط الزراعة
Roots need something to hold on to. ||| الجذور تحتاج إلى شيء تتمسك به.
The middle shelf has the growing medium. ||| الرف الأوسط فيه وسط الزراعة.
Tap the glowing shelf. ||| المس الرف المتوهج.
Clean, soil-free growing medium. Roots can hold on to it. ||| وسط زراعة نظيف بلا تربة. الجذور تستطيع التمسك به.
Growing medium: click to prepare ||| وسط الزراعة: اضغط للتجهيز
Collect the seeds ||| اجمع البذور
Now the seeds. ||| الآن البذور.
The seed shelf is glowing. ||| رف البذور متوهج.
Three seeds. They need water, light and time to grow. ||| ثلاث بذور. تحتاج إلى ماء وضوء ووقت لتنمو.
Seed shelf: click to take 3 seeds ||| رف البذور: اضغط لتأخذ 3 بذور
Plant the 3 seeds in the tray ||| ازرع البذور الثلاث في الصينية
Time to plant. ||| حان وقت الزراعة.
The hydroponic tray is glowing. ||| صينية الزراعة المائية متوهجة.
Tap the glowing tray, 3 times. ||| المس الصينية المتوهجة 3 مرات.
Growing cycle started ||| بدأت دورة النمو
They will grow over the next Sols, if they get water and electricity. Check them later and harvest when they are ready. ||| ستنمو خلال السولات القادمة إذا حصلت على الماء والكهرباء. تفقدها لاحقًا واحصدها عندما تنضج.
Seed planted ||| تمت زراعة البذرة
Hydroponic tray: click to plant a seed ||| صينية الزراعة: اضغط لزراعة بذرة
Check ORBI: his battery has a fault ||| افحص أوربي: بطاريته فيها عطل
ORBI: click to diagnose and repair ||| أوربي: اضغط للتشخيص والإصلاح
Look at ORBI. He is glowing. ||| انظر إلى أوربي. إنه متوهج.
Tap ORBI to open his repair panel. ||| المس أوربي لتفتح لوحة إصلاحه.
Toby... my... power... something is wrong with me. ||| {N}… طاقتي… شيء ما خطأ فيّ.
Learn about heat loss on the computer ||| تعلّم عن فقدان الحرارة على الحاسوب
The outside is getting very cold. The computer can tell us more. ||| الجو في الخارج يبرد جدًا. الحاسوب يخبرنا أكثر.
Freezing night! ||| ليلة متجمدة!
Heat escapes through windows and walls. ||| الحرارة تهرب من النوافذ والجدران.
Heaters then burn more energy. ||| فتستهلك المدافئ طاقة أكثر.
How to keep heat in ||| كيف نحبس الحرارة
Shutters ||| الستائر
trap a layer of air. ||| تحبس طبقة من الهواء.
Shiny blankets ||| البطانيات اللامعة
bounce heat back. ||| تعكس الحرارة للداخل.
Let us insulate ||| لنعزل القاعدة
Close the west window shutter ||| أغلق ستارة النافذة الغربية
Windows lose a lot of heat. ||| النوافذ تفقد حرارة كثيرة.
There are two window walls, west and east. ||| هناك جداران بنوافذ، الغربي والشرقي.
Tap the glowing west window. ||| المس النافذة الغربية المتوهجة.
West shutter closed. ||| أُغلقت الستارة الغربية.
West window: click to close the shutter ||| النافذة الغربية: اضغط لإغلاق الستارة
Close the east windows ||| أغلق النوافذ الشرقية
The other windows too. ||| وكذلك النوافذ الأخرى.
The east wall has three windows. ||| الجدار الشرقي فيه ثلاث نوافذ.
Tap the glowing east windows. ||| المس النوافذ الشرقية المتوهجة.
East shutters closed. ||| أُغلقت الستائر الشرقية.
East windows: click to close the shutters ||| النوافذ الشرقية: اضغط لإغلاق الستائر
Take the reflective blankets ||| خذ البطانيات العاكسة
Shiny blankets reflect heat. ||| البطانيات اللامعة تعكس الحرارة.
The silver crate is glowing. ||| الصندوق الفضي متوهج.
Tap the glowing crate. ||| المس الصندوق المتوهج.
Shiny blankets. Let us hang them near the sleeping pods. ||| بطانيات لامعة. لنعلّقها قرب كبسولات النوم.
Reflective blankets: click to take ||| البطانيات العاكسة: اضغط لتأخذها
Install the blankets by the first pod ||| ركّب البطانيات عند الكبسولة الأولى
Hang the blankets where heat escapes. ||| علّق البطانيات حيث تهرب الحرارة.
The sleeping pods are glowing. ||| كبسولات النوم متوهجة.
Tap the glowing pod. ||| المس الكبسولة المتوهجة.
Blanket installed. ||| تم تركيب البطانية.
Sleeping pod: click to hang a blanket ||| كبسولة النوم: اضغط لتعلّق بطانية
Install the blankets by the second pod ||| ركّب البطانيات عند الكبسولة الثانية
One more. ||| واحدة أخرى.
The other pod is glowing. ||| الكبسولة الأخرى متوهجة.
Insulation done ||| اكتمل العزل
Heat loss reduced. ||| قلّ فقدان الحرارة.
Insulation level: ||| مستوى العزل:
%. Heaters now use less energy. ||| %. المدافئ تستهلك طاقة أقل الآن.
Check the oxygen warning on the computer ||| افحص تحذير الأكسجين على الحاسوب
An alarm! The air is not safe. ||| إنذار! الهواء غير آمن.
The computer shows the air system. ||| الحاسوب يعرض نظام الهواء.
LIFE SUPPORT ALARM ||| إنذار دعم الحياة
Oxygen is dropping. The air filter system has a fault. ||| الأكسجين ينقص. نظام فلتر الهواء فيه عطل.
Life support cleans the air and makes oxygen. Plants help a little, but they cannot replace it. ||| دعم الحياة ينظّف الهواء وينتج الأكسجين. النباتات تساعد قليلًا لكنها لا تحل محله.
The filter is clogged. Check the life-support units. ||| الفلتر مسدود. افحص وحدات دعم الحياة.
Three units are glowing. Look at each one. ||| ثلاث وحدات متوهجة. انظر إلى كل واحدة.
Tap each glowing unit. One is clogged. ||| المس كل وحدة متوهجة. واحدة منها مسدودة.
Air filter: CLOGGED ||| فلتر الهواء: مسدود
Dust has clogged this filter. ||| الغبار سدّ هذا الفلتر.
This unit is working. Check another. ||| هذه الوحدة تعمل. افحص أخرى.
Life-support unit A: click to inspect ||| وحدة دعم الحياة A: اضغط للفحص
Life-support unit B: click to inspect ||| وحدة دعم الحياة B: اضغط للفحص
Life-support unit C: click to inspect ||| وحدة دعم الحياة C: اضغط للفحص
It needs cleaning. ||| تحتاج إلى تنظيف.
Back to the clogged unit. ||| ارجع إلى الوحدة المسدودة.
Tap the glowing unit several times. ||| المس الوحدة المتوهجة عدة مرات.
Cleaning... ||| جارٍ التنظيف…
Clogged filter: tap to clean ||| فلتر مسدود: المس للتنظيف
Restart life support on the computer ||| أعد تشغيل دعم الحياة على الحاسوب
Now restart the system. ||| الآن أعد تشغيل النظام.
The computer controls life support. ||| الحاسوب يتحكم في دعم الحياة.
Life support restarted ||| أُعيد تشغيل دعم الحياة
Oxygen generation is working again. ||| إنتاج الأكسجين يعمل من جديد.
Oxygen will rise slowly, because the air needs time to recover. Your plants add a little too. ||| الأكسجين سيرتفع ببطء لأن الهواء يحتاج إلى وقت ليتعافى. ونباتاتك تضيف قليلًا أيضًا.
Inspect: resources on the computer ||| افحص: الموارد على الحاسوب
A quiet day. Let us inspect everything. ||| يوم هادئ. لنفحص كل شيء.
Start with the computer. ||| ابدأ بالحاسوب.
Resource inspection ||| فحص الموارد
Crew safety: ||| سلامة الطاقم:
Inspect: ORBI ||| افحص: أوربي
Check on ORBI too. ||| تفقد أوربي أيضًا.
ORBI is glowing. ||| أوربي متوهج.
Tap ORBI. ||| المس أوربي.
ORBI check ||| فحص أوربي
Inspect: solar panels ||| افحص: الألواح الشمسية
The power comes from the sun. ||| الكهرباء تأتي من الشمس.
Check a solar panel outside. ||| افحص لوحًا شمسيًا في الخارج.
Tap the glowing solar panel. ||| المس اللوح الشمسي المتوهج.
Solar panels ||| الألواح الشمسية
Dust ||| الغبار
Dust slowly comes back. Clean when it is above 35%. ||| الغبار يعود ببطء. نظّف عندما يزيد عن 35%.
Clean now ||| نظّف الآن
Inspect: water pipes ||| افحص: أنابيب الماء
Check the water system. ||| افحص نظام الماء.
Check the pipes near the tanks. ||| افحص الأنابيب قرب الخزانات.
Tap the glowing pipe. ||| المس الأنبوب المتوهج.
Pipes ||| الأنابيب
Still leaking! ||| ما زال يتسرب!
No leaks. ||| لا يوجد تسريب.
Patch now ||| رقّع الآن
Inspect: plants ||| افحص: النباتات
How are the plants? ||| كيف حال النباتات؟
Tap the glowing tray. ||| المس الصينية المتوهجة.
Plants ||| النباتات
Plant ||| النبات
No plants were planted. ||| لم تُزرع أي نباتات.
Harvest now ||| احصد الآن
Inspect: radiation shield ||| افحص: درع الإشعاع
Check the shield outside the south wall. ||| افحص الدرع خارج الجدار الجنوبي.
A shield panel is glowing. ||| لوح درع متوهج.
Tap the glowing panel. ||| المس اللوح المتوهج.
Radiation shield ||| درع الإشعاع
Shield ||| الدرع
Tighten now ||| شُدّ الآن
Inspect: life support ||| افحص: دعم الحياة
Last one: the air system. ||| الأخير: نظام الهواء.
The life-support unit is glowing. ||| وحدة دعم الحياة متوهجة.
Tap the glowing unit. ||| المس الوحدة المتوهجة.
Life support ||| دعم الحياة
Oxygen ||| الأكسجين
Check the communication status on the computer ||| افحص حالة الاتصال على الحاسوب
The radio is silent. ||| الراديو صامت.
Look at the computer. ||| انظر إلى الحاسوب.
Communication ||| الاتصال
NO SIGNAL from Earth. ||| لا توجد إشارة من الأرض.
The dish on the rover may be pointing the wrong way. Go to the rover and align it. ||| ربما الهوائي على الروفر يتجه في الاتجاه الخطأ. اذهب إلى الروفر وعدّله.
Align the antenna at the rover ||| عدّل الهوائي على الروفر
The antenna must point at Earth. ||| يجب أن يتجه الهوائي نحو الأرض.
The rover is outside, south of the base. It is glowing. ||| الروفر في الخارج جنوب القاعدة. إنه متوهج.
Tap the glowing rover. ||| المس الروفر المتوهج.
Rover antenna: click to align ||| هوائي الروفر: اضغط للتعديل
Send the SOS in Morse code ||| أرسل نداء SOS بشفرة مورس
Morse code: short and long signals. SOS is three short, three long, three short. ||| شفرة مورس: إشارات قصيرة وطويلة. SOS هي ثلاث قصيرة، ثلاث طويلة، ثلاث قصيرة.
Use the rover radio again. ||| استخدم راديو الروفر مرة أخرى.
Tap the rover and enter: short short short, long long long, short short short. ||| المس الروفر وأدخل: قصيرة قصيرة قصيرة، طويلة طويلة طويلة، قصيرة قصيرة قصيرة.
Rover radio: click to send the SOS ||| راديو الروفر: اضغط لإرسال SOS
Final check: energy and crew safety ||| الفحص النهائي: الطاقة وسلامة الطاقم
Last day! Let us check everything is ready. ||| اليوم الأخير! لنتأكد أن كل شيء جاهز.
Start at the computer. ||| ابدأ من الحاسوب.
Final check: systems ||| الفحص النهائي: الأنظمة
Final check: water containment ||| الفحص النهائي: احتواء الماء
Is any water escaping? ||| هل يتسرب أي ماء؟
The pipe section is glowing. ||| جزء الأنبوب متوهج.
Water containment ||| احتواء الماء
Leak! ||| تسريب!
Sealed. ||| محكم الإغلاق.
Final check: plants and food ||| الفحص النهائي: النباتات والطعام
Food reserves and plants. ||| مخزون الطعام والنباتات.
The tray is glowing. ||| الصينية متوهجة.
Food and plants ||| الطعام والنباتات
Food ||| الطعام
% grown ||| % نمو
Final check: life support ||| الفحص النهائي: دعم الحياة
The air system. ||| نظام الهواء.
The unit is glowing. ||| الوحدة متوهجة.
Final check: ORBI ||| الفحص النهائي: أوربي
Is ORBI ready? ||| هل أوربي جاهز؟
Final check: radiation shield ||| الفحص النهائي: درع الإشعاع
Radiation protection. ||| الحماية من الإشعاع.
Declare the crew ready for departure ||| أعلن أن الطاقم جاهز للمغادرة
Everything checked? Then it is time. ||| هل فحصنا كل شيء؟ إذن حان الوقت.
The computer will give the final result. ||| الحاسوب سيعطي النتيجة النهائية.
Harvest! ||| احصد!
Brush the panels: ||| نظّف الألواح بالفرشاة:
/3 clean · ||| /3 نظيفة ·
ORBI repair panel ||| لوحة إصلاح أوربي
ORBI's battery has 3 loose wires. Connect each wire on the left to the terminal of the same color on the right: tap the left one, then the right one. ||| بطارية أوربي فيها 3 أسلاك مفكوكة. صِل كل سلك على اليسار بالطرف الذي له نفس اللون على اليمين: المس الأيسر ثم الأيمن.
Close ||| إغلاق
Tap a wire on the left first. ||| المس سلكًا على اليسار أولًا.
Connected! ||| تم التوصيل!
Systems online! Thank you, Toby. I feel much better. ||| الأنظمة تعمل! شكرًا يا {N}. أشعر بتحسن كبير.
Not the same color. Try again! ||| ليس اللون نفسه. حاول مرة أخرى!
Align the antenna ||| عدّل الهوائي
Move both sliders until the signal strength is full. A dish must point exactly at Earth. ||| حرّك المزلاجين حتى تمتلئ قوة الإشارة. الهوائي يجب أن يتجه إلى الأرض بدقة.
Turn ||| الدوران
Tilt ||| الإمالة
Signal ||| الإشارة
Locked on Earth! ||| تم الاتجاه نحو الأرض!
Getting warmer... ||| تقترب…
Weak signal. ||| إشارة ضعيفة.
Antenna aligned! Now we can send a message. ||| تم تعديل الهوائي! الآن نستطيع إرسال رسالة.
Send an SOS in Morse code ||| أرسل SOS بشفرة مورس
SOS is the international distress call: 3 short, 3 long, 3 short. ||| SOS هو نداء الاستغاثة الدولي: 3 قصيرة، 3 طويلة، 3 قصيرة.
● short ||| ● قصيرة
▬ long ||| ▬ طويلة
Reset ||| إعادة ضبط
SOS sent! Earth is answering... ||| تم إرسال SOS! الأرض تردّ…
Earth confirms the rescue and return plan. We did it, Toby! ||| الأرض تؤكد خطة الإنقاذ والعودة. نجحنا يا {N}!
That is not SOS. Try again: 3 short, 3 long, 3 short. ||| هذا ليس SOS. حاول مرة أخرى: 3 قصيرة، 3 طويلة، 3 قصيرة.
Problems that will carry over to tomorrow: ||| مشاكل ستنتقل إلى الغد:
Everything is in good shape. ||| كل شيء في حالة جيدة.
Rest and end Sol ||| ارتح وأنهِ السول
Rest now ||| ارتح الآن
Not yet ||| ليس بعد
Night report · Sol ||| تقرير الليل · سول
Still unsolved ||| ما زال بلا حل
They will keep hurting us tomorrow! ||| ستستمر في إيذائنا غدًا!
No problems left! ||| لا مشاكل متبقية!
Great work, Toby. ||| عمل رائع يا {N}.
Start Sol ||| ابدأ السول
SUCCESS ||| نجاح
FAILURE ||| فشل
PARTIAL SUCCESS ||| نجاح جزئي
MISSION ||| المهمة
Score ||| النتيجة
How you did ||| كيف كان أداؤك
Why? ||| لماذا؟
All numbers are game values for learning. ||| كل الأرقام قيم في اللعبة للتعلّم.
Follow me, Toby! To the base! ||| اتبعني يا {N}! إلى القاعدة!
Dust is blocking our solar panels. ||| الغبار يحجب ألواحنا الشمسية.
Water is draining too fast. ||| الماء ينقص بسرعة كبيرة.
Food is running low. Let us grow some! ||| الطعام يقل. لنزرع بعضًا!
ORBI is glitching. His battery is broken. ||| أوربي يتعطل. بطاريته معطوبة.
A freezing night is coming. ||| ليلة متجمدة قادمة.
The air filter is failing. ||| فلتر الهواء يتعطل.
A quiet day: inspect everything. ||| يوم هادئ: افحص كل شيء.
No signal from Earth! ||| لا توجد إشارة من الأرض!
Last day: is everyone ready to leave? ||| اليوم الأخير: هل الجميع جاهز للمغادرة؟
the water leak ||| تسريب الماء
the air filter ||| فلتر الهواء
the insulation ||| العزل
the dusty panels ||| الألواح المغبّرة
the water recycler ||| مُدوِّر الماء
the loose shield ||| الدرع المفكوك
🚨 Emergency repair ||| 🚨 إصلاح طارئ
Too many days passed, so ORBI fixed ||| مرّت أيام كثيرة، فأصلح أوربي
using the emergency reserves. ||| باستخدام احتياطي الطوارئ.
It saved us, but it costs points. Fix problems yourself next time! ||| أنقذنا ذلك لكنه يكلّف نقاطًا. أصلح المشاكل بنفسك في المرة القادمة!
Nothing resets: yesterday's problems are still here. ||| لا شيء يُعاد ضبطه: مشاكل الأمس ما زالت هنا.
First: ||| أولًا:
Let us see what today brings. ||| لنرَ ماذا يحمل هذا اليوم.
ORBI is offline. Fix his battery first. ||| أوربي متوقف. أصلح بطاريته أولًا.
Everything is done for now. ||| انتهى كل شيء الآن.
Toby, I think we should check ||| يا {N}، أظن أنه يجب أن نفحص
🍎 Food ||| 🍎 الطعام
Safety ||| الأمان
night: no sunlight ||| الليل: لا ضوء شمس
dusty solar panels ||| ألواح شمسية مغبّرة
low battery ||| بطارية ضعيفة
running the base ||| تشغيل القاعدة
a LEAK! ||| تسريب!
recycler is OFF ||| المُدوِّر مطفأ
air filter fault ||| عطل فلتر الهواء
no power for life support ||| لا كهرباء لدعم الحياة
eating, no plants yet ||| الأكل، ولا نباتات بعد
is going down because: ||| ينخفض بسبب:
Energy is low! Life support may stop. Check the solar panels. ||| الطاقة قليلة! قد يتوقف دعم الحياة. افحص الألواح الشمسية.
Oxygen is getting low! ||| الأكسجين يقل!
Water is running low! ||| الماء يقل!
Food is running low! ||| الطعام يقل!
It is getting dark and very cold outside. Let us rest, Toby. ||| يزداد الظلام والبرد في الخارج. لنرتح يا {N}.
The pods are along the south wall. ||| الكبسولات على طول الجدار الجنوبي.
The pods are glowing. ||| الكبسولات متوهجة.
Tap a glowing pod. ||| المس كبسولة متوهجة.
Time is up! ||| انتهى الوقت!
of 3 panels are clean. The dust left on the others will keep reducing our power. ||| من 3 ألواح نظيفة. الغبار المتبقي على الباقي سيستمر في تقليل طاقتنا.
All three panels are clean! Power will come back. ||| الألواح الثلاثة نظيفة! ستعود الطاقة.
Brush ON! Tap a dusty panel and the rover will drive there. ||| الفرشاة تعمل! المس لوحًا مغبّرًا وسيذهب الروفر إليه.
Panel ||| اللوح
is clean! ||| نظيف!
I did that one for you. Next time you can try it yourself! ||| فعلت هذه لك. في المرة القادمة جرّبها بنفسك!
Stuck? Let ORBI help ||| عالق؟ دع أوربي يساعد
Those are heavy metal panels. The white plastic panels in the other crate block radiation best! ||| هذه ألواح معدنية ثقيلة. الألواح البلاستيكية البيضاء في الصندوق الآخر توقف الإشعاع أفضل!
: dust ||| : غبار
Info ||| معلومة
Plants: ||| النباتات:
No plants yet. ||| لا نباتات بعد.
A shield panel is loose here. ||| لوح درع مفكوك هنا.
Radiation shield: ||| درع الإشعاع:
Nothing to do here right now. ||| لا شيء نفعله هنا الآن.
💨 Air maker ||| 💨 صانع الهواء
OFF: oxygen falls ||| مطفأ: الأكسجين ينخفض
💧 Water recycler ||| 💧 مُدوِّر الماء
OFF: water is not saved ||| مطفأ: الماء لا يُوفَّر
💡 Plant lights ||| 💡 أضواء النباتات
OFF: plants stop growing ||| مطفأ: النباتات تتوقف عن النمو
🔥 Heater ||| 🔥 المدفأة
OFF: the base freezes ||| مطفأة: القاعدة تتجمد
Power control ||| التحكم بالطاقة
☀ making ||| ☀ إنتاج
% · using ||| % · استهلاك
% per hour ||| % في الساعة
Mission computer · Sol ||| حاسوب المهمة · سول
Switch OFF ||| أطفئ
is OFF. We save energy now, but: ||| مطفأ. نوفّر طاقة الآن لكن:
. You can switch it back ON on the mission computer. ||| . يمكنك تشغيله من جديد على حاسوب المهمة.
Keep everything ON ||| أبقِ كل شيء يعمل
Okay! But the battery may run out. Fix the cause of the problem fast! ||| حسنًا! لكن البطارية قد تنفد. أصلح سبب المشكلة بسرعة!
⚠ Energy is low! ||| ⚠ الطاقة قليلة!
Everything uses energy. What do you switch OFF to save it? ||| كل شيء يستهلك طاقة. ماذا تطفئ لتوفّرها؟
There is no free choice: every OFF has a price. ||| لا يوجد خيار مجاني: لكل إطفاء ثمن.
Click: use the mission computer ||| اضغط: استخدم حاسوب المهمة
Click: scrub the panel ||| اضغط: نظّف اللوح
Mission computer: check status ||| حاسوب المهمة: افحص الحالة
Click: ask ORBI for help ||| اضغط: اطلب مساعدة أوربي
Sleeping pod: end the Sol ||| كبسولة النوم: أنهِ السول
✔ SOL 1 COMPLETE ||| ✔ اكتمل السول 1
You protected the base from radiation! ||| حميت القاعدة من الإشعاع!
What we learned ||| ماذا تعلّمنا
🛡 HDPE plastic blocks radiation. ||| 🛡 بلاستيك HDPE يوقف الإشعاع.
The power came back by a separate repair: the shield only blocks radiation. ||| عادت الكهرباء بإصلاح منفصل: الدرع يوقف الإشعاع فقط.
Tomorrow starts like this ||| هكذا يبدأ الغد
Nothing resets. ||| لا شيء يُعاد ضبطه.
Real NASA science ||| علم ناسا الحقيقي
Start Sol 2 ||| ابدأ السول 2
LIVE ||| مباشر
SAVED ||| محفوظ
NOT USED ||| غير مستخدم
Loading NASA data... ||| جارٍ تحميل بيانات ناسا…
A real photo from Jezero ||| صورة حقيقية من جيزيرو
Latest image from the Perseverance rover · sol ||| أحدث صورة من الروفر بيرسيفيرنس · سول
on Mars · camera ||| على المريخ · الكاميرا
In the last ||| في آخر
days NASA recorded ||| يومًا سجّلت ناسا
A NASA model predicted that a CME would reach ||| توقع نموذج لناسا أن قذفًا كتليًا إكليليًا سيصل إلى
Mars ||| المريخ
Last 30 days: NASA models predict no CME reaching Mars. ||| آخر 30 يومًا: نماذج ناسا لا تتوقع وصول أي قذف كتلي إلى المريخ.
Highest geomagnetic storm index at Earth: Kp ||| أعلى مؤشر عاصفة مغناطيسية أرضية: Kp
Average dose on the station: ||| متوسط الجرعة على المحطة:
days of dose on the station. ||| أيام من الجرعة على المحطة.
NASA studies how deep-space radiation affects the body. Example: ||| تدرس ناسا كيف يؤثر إشعاع الفضاء العميق في الجسم. مثال:
A real photo from Jezero · Perseverance rover ||| صورة حقيقية من جيزيرو · الروفر بيرسيفيرنس
NASA saw ||| رصدت ناسا
solar eruptions in ||| ثورانات شمسية في
days. The fastest: ||| يومًا. الأسرع:
NASA data: loading... ||| بيانات ناسا: جارٍ التحميل…
NASA data: LIVE ● (I) ||| بيانات ناسا: مباشرة ● (I)
NASA data: saved copy (I) ||| بيانات ناسا: نسخة محفوظة (I)
NASA data: unavailable (I) ||| بيانات ناسا: غير متاحة (I)
Not available ||| غير متاح
Latest real photo from Jezero crater. ||| أحدث صورة حقيقية من فوهة جيزيرو.
Data sources in the game ||| مصادر البيانات في اللعبة
Save and reload ||| الحفظ وإعادة التحميل
Emergency Landing & Radiation Protection ||| هبوط اضطراري وحماية من الإشعاع
Dust & Energy ||| الغبار والطاقة
Water Leak ||| تسريب الماء
Food Production ||| إنتاج الطعام
ORBI Repair ||| إصلاح أوربي
Extreme Cold ||| برد شديد
Oxygen System ||| نظام الأكسجين
Full Resource Inspection ||| فحص شامل للموارد
Communication Failure ||| انقطاع الاتصال
Final Mission Checklist ||| قائمة المهمة النهائية
Dust on the solar panels is cutting electricity. ||| الغبار على الألواح الشمسية يقلّل الكهرباء.
A water leak keeps draining the tanks. ||| تسريب ماء يفرّغ الخزانات باستمرار.
Water recycling is OFF, so every drink is lost. ||| إعادة تدوير الماء مطفأة، فيضيع كل ماء نشربه.
ORBI is damaged and helps less. ||| أوربي معطوب ويساعد أقل.
The habitat loses heat, so heaters burn extra energy. ||| القاعدة تفقد الحرارة فتستهلك المدافئ طاقة إضافية.
The air filter fault keeps oxygen falling. ||| عطل فلتر الهواء يُبقي الأكسجين ينخفض.
A radiation-shield panel is loose. ||| لوح في درع الإشعاع مفكوك.
No contact with Earth. ||| لا اتصال مع الأرض.
The air maker is switched OFF, so oxygen is falling. ||| صانع الهواء مطفأ، فالأكسجين ينخفض.
The water recycler is OFF, so water is not saved. ||| مُدوِّر الماء مطفأ، فالماء لا يُوفَّر.
Plant lights are OFF, so plants are not growing. ||| أضواء النباتات مطفأة، فالنباتات لا تنمو.
The heater is OFF, so the base is freezing and plants suffer. ||| المدفأة مطفأة، فالقاعدة تتجمد والنباتات تتأذى.
No plants growing, so food only goes down. ||| لا نباتات تنمو، فالطعام ينقص فقط.
Safe ||| آمن
Caution ||| حذر
Warning ||| تحذير
Critical ||| حرج
Oxygen is low ||| الأكسجين قليل
Water is low ||| الماء قليل
Food is low ||| الطعام قليل
Power is low, life support may stop ||| الطاقة قليلة، وقد يتوقف دعم الحياة
Radiation exposure is high ||| التعرض للإشعاع مرتفع
The habitat is damaged ||| القاعدة متضررة
The heater is OFF: the base is freezing ||| المدفأة مطفأة: القاعدة تتجمد
All systems normal ||| كل الأنظمة طبيعية
Energy ||| الطاقة
Water ||| الماء
Radiation protection ||| الحماية من الإشعاع
Habitat condition ||| حالة القاعدة
ORBI condition ||| حالة أوربي
Contact with Earth ||| الاتصال بالأرض
A life-critical system is out of range: ||| نظام حيوي خرج عن النطاق الآمن:
The heater was OFF for ||| كانت المدفأة مطفأة لمدة
ORBI had to finish ||| اضطر أوربي إلى إنهاء
task(s) for you. ||| مهمة بدلًا منك.
The SOS was never sent, so Earth could not confirm the return plan. ||| لم يُرسَل نداء SOS، فلم تستطع الأرض تأكيد خطة العودة.
Every system was maintained and Earth confirmed the return plan. ||| تمت صيانة كل الأنظمة وأكدت الأرض خطة العودة.
We can leave, but some systems were weak. Fix problems early next time! ||| نستطيع المغادرة لكن بعض الأنظمة كانت ضعيفة. أصلح المشاكل مبكرًا في المرة القادمة!
START ||| ابدأ
Welcome back ||| أهلًا بعودتك
New mission ||| مهمة جديدة
Astronaut registration ||| تسجيل رائد الفضاء
Who is boarding today? ||| من سيصعد إلى السفينة اليوم؟
Enter your name ||| اكتب اسمك
Select your age ||| اكتب عمرك
Your name ||| اسمك
Your age ||| عمرك
Continue ||| متابعة
MISSION BRIEFING ||| إحاطة المهمة
WHERE ||| إلى أين
Mars Research Base ||| قاعدة أبحاث المريخ
WHY ||| لماذا
The base needs help ||| القاعدة تحتاج إلى مساعدة
WHAT ||| ماذا
Repair systems · manage power, oxygen, water and food · keep the crew safe ||| أصلح الأنظمة · أدِر الطاقة والأكسجين والماء والطعام · حافظ على سلامة الطاقم
HOW LONG ||| كم المدة
10 Sols (Martian days) ||| 10 سولات (أيام مريخية)
Sound: on ||| الصوت: يعمل
Sound: off ||| الصوت: مغلق
SPACE PROGRAM ||| برنامج الفضاء
Enter your age ||| اكتب عمرك
Skip Intro ▶ ||| تخطي المقدمة ◀
Cabin lights online ||| أضواء المقصورة تعمل
Launch systems ||| أنظمة الإطلاق
Power ||| الطاقة
Fuel ||| الوقود
Guidance ||| التوجيه
Crew secured ||| الطاقم مُثبَّت
Countdown ||| العد التنازلي
Engines on ||| المحركات تعمل
Liftoff ||| الإقلاع
Earth to Mars ||| من الأرض إلى المريخ
Welcome aboard, ||| أهلًا بك على متن السفينة يا
! We're on our way to Mars. ||| ! نحن في طريقنا إلى المريخ.
Our destination is the Mars Research Base. ||| وجهتنا هي قاعدة أبحاث المريخ.
The base needs help! We must repair its systems, manage power, oxygen, water and food, and keep the crew safe. ||| القاعدة تحتاج إلى مساعدة! علينا إصلاح أنظمتها، وإدارة الطاقة والأكسجين والماء والطعام، والحفاظ على سلامة الطاقم.
We have 10 Martian days, called Sols, to complete our mission. ||| لدينا 10 أيام مريخية، تُسمّى سولات، لإكمال مهمتنا.
I need your help, Astronaut! ||| أحتاج إلى مساعدتك يا رائد الفضاء!
Warning! We're losing control! Brace for landing! ||| تحذير! نفقد السيطرة! استعدّ للهبوط!
Ask ORBI ||| اسأل أوربي
Ask ORBI (H) ||| اسأل أوربي (H)
Sound (M) ||| الصوت (M)
ORBI ||| أوربي
SUIT ||| البدلة
10 Days on Mars ||| عشرة أيام على المريخ
Go outside to the rover (it is beeping!) ||| اخرج إلى الروفر (إنه يصفّر!)
Next ▶ ||| التالي ◀
task(s) not finished today ||| مهام لم تنتهِ اليوم
because: ||| بسبب:
drinking ||| الشرب
eating (plants still growing) ||| الأكل (النباتات ما زالت تنمو)
the solar panel ||| اللوح الشمسي
the mission computer ||| حاسوب المهمة
the computer ||| الحاسوب
the rover ||| الروفر
the pipes ||| الأنابيب
the tray ||| الصينية
the shield ||| الدرع
the life-support unit ||| وحدة دعم الحياة
the tank ||| الخزان
the shelf ||| الرف
the crate ||| الصندوق
the pod ||| الكبسولة
the sleeping pod ||| كبسولة النوم
Tap a dusty panel: the rover brushes it ||| المس لوحًا مغبّرًا: الروفر ينظّفه
Click: rest in the sleeping pod to end the Sol ||| اضغط: ارتح في كبسولة النوم لإنهاء السول
Repair the cracked pipe ||| أصلح الأنبوب المشقوق
The recycler needs electricity, so it uses a little energy. ||| المُدوِّر يحتاج إلى كهرباء، فيستهلك قليلًا من الطاقة.
(Simulation values.) ||| (قيم المحاكاة.)
It has harmful salts (NASA's Phoenix lander found perchlorates) and few nutrients. ||| فيها أملاح ضارة (وجدت مركبة فينيكس التابعة لناسا البيركلورات) ومغذيات قليلة.
Plant the 3 seeds ||| ازرع البذور الثلاث
seeds planted! ||| بذور مزروعة!
damaged ||| معطوب
Bzzt... ||| بززت…
Check ORBI: his battery has a fault. ||| افحص أوربي: بطاريته فيها عطل.
Find the clogged air filter (inspect the units) ||| اعثر على فلتر الهواء المسدود (افحص الوحدات)
Clean the filter ||| نظّف الفلتر
Click: inspect: ||| اضغط: افحص:
Click: final check: ||| اضغط: الفحص النهائي:
water pipes ||| أنابيب الماء
plants ||| النباتات
radiation shield ||| درع الإشعاع
life support ||| دعم الحياة
resources ||| الموارد
solar panels ||| الألواح الشمسية
water containment ||| احتواء الماء
plants and food ||| النباتات والطعام
ready! ||| جاهز!
plant(s) gave us fresh food. ||| نباتات أعطتنا طعامًا طازجًا.
A panel is loose. ||| لوح مفكوك.
Working normally. ||| يعمل بشكل طبيعي.
harvested ||| تم الحصاد
The crew is ready to go home! Every choice you made kept us alive. ||| الطاقم جاهز للعودة إلى الوطن! كل اختيار قمت به أبقانا أحياء.
`;

const PAIRS = RAW.split('\n').map(l => l.split(' ||| ')).filter(p => p.length === 2 && p[0].trim()).map(([e, a]) => [e.trim(), a.trim()]);
PAIRS.sort((x, y) => y[0].length - x[0].length);   // longest phrase first
const DAYS = { Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت', Sunday: 'الأحد' };
const MONTHS = { January: 'يناير', February: 'فبراير', March: 'مارس', April: 'أبريل', May: 'مايو', June: 'يونيو', July: 'يوليو', August: 'أغسطس', September: 'سبتمبر', October: 'أكتوبر', November: 'نوفمبر', December: 'ديسمبر' };
const PATTERNS = [   // numbers, dates and clocks
  [/\bDay (\d+) of (\d+)/g, 'اليوم $1 من $2'], [/\b[Ss][Oo][Ll] (\d+) (?:of|\/) (\d+)/g, 'السول $1 من $2'], [/\b[Ss][Oo][Ll] (\d+)\b/g, 'السول $1'],
  [new RegExp('\\b(' + Object.keys(DAYS).join('|') + ')\\b', 'g'), (m, d) => DAYS[d]], [new RegExp('\\b(' + Object.keys(MONTHS).join('|') + ')\\b', 'g'), (m, d) => MONTHS[d]],
  [/\bat (\d\d:\d\d)/g, 'الساعة $1'], [/(\d+)\/(\d+) tasks/g, '$1/$2 مهام'], [/(\d+)\/3 tasks/g, '$1/3 مهام'], [/\btasks\b/g, 'مهام'], [/\b(\d+) s\b/g, '$1 ث'],
];
const EXACT = new Map(PAIRS.map(([e, a]) => [e, a]));
const cache = new Map();
let lang = 'en', observer = null, busy = false;
const orig = new WeakMap();   // text node -> its English text
const origAttr = new WeakMap();
const nameOf = () => (window.CANTRIC_PLAYER && window.CANTRIC_PLAYER.name) || '';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function translate(en) {
  if (!en || !/[A-Za-z]/.test(en)) return en;
  const nm = nameOf(), key = nm + '|' + en;
  if (cache.has(key)) return cache.get(key);
  let s = en;
  if (nm && nm !== 'Toby') s = s.replace(new RegExp('(?<![\\p{L}\\p{N}])' + esc(nm) + '(?![\\p{L}\\p{N}])', 'gu'), 'Toby');   // the game writes the player's name; the dictionary was written with Toby
  const t = s.trim(); let out;
  if (EXACT.has(t)) out = s.replace(t, EXACT.get(t));
  else {
    out = s;
    for (const [e, a] of PAIRS) { if (e.length < 3) continue; if (out.includes(e)) { out = e.length <= 12 ? out.replace(new RegExp((/^[A-Za-z]/.test(e) ? '(?<![A-Za-z])' : '') + esc(e) + (/[A-Za-z]$/.test(e) ? '(?![A-Za-z])' : ''), 'g'), () => a) : out.split(e).join(a); } }
  }
  for (const [re, rep] of PATTERNS) out = out.replace(re, rep);   // numbers / dates / clocks after the phrases
  out = out.split('{N}').join(nm || 'Toby').replace(/Toby/g, nm || 'Toby');
  if (out === s) out = en; cache.set(key, out); if (cache.size > 4000) cache.clear(); return out;
}

function walk(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  let n; while ((n = w.nextNode())) doText(n);
}
function doText(n) {
  const cur = n.nodeValue; if (!cur || !cur.trim()) return;
  let en = orig.get(n);
  if (en === undefined || (cur !== en && cur !== (cache.get(nameOf() + '|' + en)))) { en = cur; orig.set(n, en); }   // the game wrote new text: remember it as the English source
  const want = lang === 'ar' ? translate(en) : en;
  if (n.nodeValue !== want) n.nodeValue = want;
}
function doAttrs(root) {
  if (root.querySelectorAll) for (const el of root.querySelectorAll('[placeholder],[aria-label],[title]')) for (const a of ['placeholder', 'aria-label', 'title']) { if (!el.hasAttribute(a)) continue; let m = origAttr.get(el); if (!m) { m = {}; origAttr.set(el, m); } const cur = el.getAttribute(a); if (m[a] === undefined || (cur !== m[a] && cur !== translate(m[a]))) m[a] = cur; const want = lang === 'ar' ? translate(m[a]) : m[a]; if (cur !== want) el.setAttribute(a, want); }
}
function sweep(root = document.body) { busy = true; try { walk(root); doAttrs(root); } finally { busy = false; } }

export function setLang(l, silent) {
  lang = l === 'ar' ? 'ar' : 'en';
  try { localStorage.setItem('cantric:lang', lang); } catch (e) { }
  const h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr';
  cache.clear(); sweep(); updateBtn(); if (!silent) window.dispatchEvent(new CustomEvent('cantric-lang', { detail: lang }));
}
export const getLang = () => lang;
let btn = null;
function updateBtn() { if (btn) { btn.textContent = lang === 'ar' ? 'English' : 'العربية'; btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'); } }

export function initI18n() {
  if (window.__i18n) return; window.__i18n = true;
  let saved = null; try { saved = localStorage.getItem('cantric:lang'); } catch (e) { }
  if (!saved) { try { saved = (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en'; } catch (e) { saved = 'en'; } }
  const st = document.createElement('style'); st.textContent = `#langbtn{position:fixed;top:8px;right:8px;z-index:300;font:600 14px/1 "Segoe UI",system-ui,"Noto Sans Arabic",sans-serif;padding:8px 14px;border-radius:999px;border:1px solid rgba(190,205,255,.45);background:rgba(8,12,28,.62);color:#eef2ff;cursor:pointer;backdrop-filter:blur(6px)}#langbtn:hover{background:rgba(50,70,140,.6)}html[dir=rtl] #langbtn{right:auto;left:8px}`; document.head.appendChild(st);
  btn = document.createElement('button'); btn.id = 'langbtn'; btn.type = 'button'; document.body.appendChild(btn);
  btn.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
  observer = new MutationObserver(muts => {
    if (busy) return; busy = true;
    try { for (const m of muts) { if (m.type === 'characterData') doText(m.target); else for (const n of m.addedNodes) { if (n.nodeType === 3) doText(n); else if (n.nodeType === 1) { walk(n); doAttrs(n); } } } } finally { busy = false; }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setLang(saved, true);
}
window.CANTRIC_I18N = { setLang, getLang, translate };
