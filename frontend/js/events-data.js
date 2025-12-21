/**
 * Sample Event Data
 * Used for populating the events page
 */
const eventsData = [
    {
        id: 1,
        title: "Lights of Saigon 2024: Đại nhạc hội EDM",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5rAulyOoZSi14akh-35GWyQf53Is0h_kqMR82owxRsehutOKfQSK0ObJvSNWEvV0xgEoTFnJWwalXUZTFXN0ksKJ_Va4BGs2legkbDqLftE3RjfRCq-Gb0gExw1TQpBXq7abWX319g1QeBWsEX5Ff45FubVNEF0GWfkGJENRjrc7cho7iiloViOsRqX-xqsdMYZqbUe_mD_ueZ9nO4nAAsH9YHIBtRLNm3QWnOhDYkx2GA3W2iu4HDYyWSSmp2Pxre9P7uKwBVoM",
        category: "Music",
        date: "20/11/2024",
        time: "19:00",
        location: "SVĐ Quân Khu 7, TP.HCM",
        price: "599.000đ",
        isHot: true,
        tagBg: "bg-red-500",
        tagText: "Hot"
    },
    {
        id: 2,
        title: "Tech Summit 2024: Kỷ nguyên AI",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQS5ixvFPmc-a-NhUUG35htf-hP08m3hRrl-rF2awGhd6AuRAH7tsEYlevO-rqGG4E0GyWdBkHaIuwSiQuKkQoRVMq83M23WAVzafYyhtKuPhFh97kFvMUltKhQFyq-L0707UqM22GLdtsNF0n6sg7VMTotoWgFOgV3cXYpniBPsYeE7cLnnrfwyyGHNuxG7rBBHplSWE-tgot4a-wukIvBg0Bdj_LOxsl7pNxTvRSPi2Syu_4NuBAEXYnfbBhfXXvshYNzeDxduI",
        category: "Tech",
        date: "22/10/2024",
        time: "08:30",
        location: "Trung tâm Hội nghị Quốc gia",
        price: "Miễn phí",
        isHot: false
    },
    {
        id: 3,
        title: "Triển lãm Nghệ thuật Đương đại \"Sống\"",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkjTVAkTTaF3ZcXyhQeu0pLjIpWtMP5HFegR9yOa955TxhYl39YbKKsMgO0UbAiIo7rmdgfq9mBmM5p_5Qn6WjG6nQcfNEswKGJhRivcWhJx6qa5GFHwfJFLg1pQphDM1uQlKTcqzprX1o9qJPv0kQzNCMxUUAzg0RAq7DXCkvGZYuiaA2EfyEbdBy9uBe0H_EB2KyKX-tb5EVVjokluc64m8sj8_Mf21QmDFaNHZsPZWJVItgQHGTCApYtKnHi4RWlH9G_22ZSm8",
        category: "Art",
        date: "25/10/2024",
        time: "09:00",
        location: "Vincom Center for Contemporary Art",
        price: "150.000đ",
        isHot: false
    },
    {
        id: 4,
        title: "Rockstorm 2024",
        image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1000&auto=format&fit=crop",
        category: "Music",
        date: "30/11/2024",
        time: "18:00",
        location: "Sân vận động Mỹ Đình",
        price: "200.000đ",
        isHot: false
    },
    {
        id: 5,
        title: "Workshop Làm Gốm Thủ Công",
        image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=1000&auto=format&fit=crop",
        category: "Workshop",
        date: "15/12/2024",
        time: "14:00",
        location: "Gốm Nhà An",
        price: "350.000đ",
        isHot: false
    },
    {
        id: 6,
        title: "Yoga Chữa Lành Tại Công Viên",
        image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1000&auto=format&fit=crop",
        category: "Workshop",
        date: "05/01/2025",
        time: "06:00",
        location: "Công viên Thống Nhất",
        price: "100.000đ",
        isHot: false
    }
];

// Expose to window for global access
window.eventsData = eventsData;
