let hasSubmitted = false;
let attendanceData = [];

// Mendapatkan lokasi perangkat
async function getDeviceLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                error => reject(error)
            );
        } else {
            reject("Geolocation tidak tersedia.");
        }
    });
}

// Menggunakan reverse geocoding untuk mendapatkan nama tempat dari OpenStreetMap (Nominatim)
async function getLocationName(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Mencari nama kampung/kecamatan dalam hasil
                let locationName = "Lokasi tidak ditemukan";
                if (data && data.address) {
                    // Nama kampung/kecamatan biasanya ditemukan dalam 'suburb' atau 'village' dalam address
                    locationName = data.address.suburb || data.address.village || data.address.town || data.address.city || "Lokasi tidak ditemukan";
                }
                resolve(locationName);
            })
            .catch(error => reject("Gagal mendapatkan nama lokasi"));
    });
}

function submitAbsence() {
    if (hasSubmitted) {
        alert("Anda sudah melakukan absensi.");
        return;
    }

    const name = document.getElementById("name").value;
    const status = document.getElementById("status").value;
    const days = document.getElementById("days").value;
    
    if (!name) {
        alert("Silakan pilih nama.");
        return;
    }
    
    if (!status) {
        alert("Silakan pilih status absensi.");
        return;
    }
    
    // Jika status "CUTI", "IZIN", atau "SAKIT", maka hari harus diisi
    if ((status === "CUTI" || status === "IZIN" || status === "SAKIT") && !days) {
        alert("Silakan pilih jumlah hari untuk status tersebut.");
        return;
    }

    // Mendapatkan lokasi perangkat
    getDeviceLocation().then(location => {
        const date = new Date();
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        const formattedTime = `${date.getHours()}:${date.getMinutes()}`;

        // Mendapatkan nama kampung/kecamatan menggunakan reverse geocoding
        getLocationName(location.latitude, location.longitude).then(locationName => {
            // Menyimpan data absensi termasuk status, jumlah hari, dan nama lokasi
            attendanceData.push({
                name, 
                status,
                days: days ? `${days} Hari` : "N/A", // Menyertakan jumlah hari jika ada
                date: formattedDate, 
                time: formattedTime, 
                location: locationName // Menampilkan nama kampung/kecamatan
            });

            // Update tabel absensi
            updateAttendanceTable();

            // Tandai absen telah dilakukan
            hasSubmitted = true;
            alert("Absensi berhasil.");
        }).catch(error => {
            alert("Gagal mendapatkan nama lokasi: " + error);
        });
    }).catch(error => {
        alert("Gagal mendapatkan lokasi perangkat.");
    });
}

// Update tabel absensi
function updateAttendanceTable() {
    const tbody = document.querySelector("#attendanceTable tbody");
    tbody.innerHTML = '';
    attendanceData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${data.name}</td><td>${data.status}</td><td>${data.days}</td><td>${data.date}</td><td>${data.time}</td><td>${data.location}</td>`;
        tbody.appendChild(row);
    });
}

// Ekspor data absensi ke Excel
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(attendanceData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");
    XLSX.writeFile(wb, "data_absensi.xlsx");
}
