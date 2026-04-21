const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzFOyqH2m8DOzCOdGPNuiqAWXfK177CvU-ca_QZZXutydiKhFfvh0dNIa95slkT1-L_/exec";
const ADMIN_NUMBER = "6285117010280";
let batchCount = 0;

// 1. DATA CONFIGURATION
const LIST_TOPPING = [
    {label:'- Tanpa Topping -', harga:0}, {label:'Meses', harga:2000},
    {label:'Keju', harga:3000}, {label:'Oreo', harga:3000},
    {label:'Kacang', harga:2000}, {label:'Susu', harga:1000},
    {label:'Almond', harga:4000}
];

const MENUS = {
    pancong: [
        {label:'Cokelat Crunchy', harga:11000},       
        {label:'Cokelat Keju', harga:13000},
        {label:'Original', harga:7000},
        {label:'Coklat Oreo', harga:13000},
        {label:'Tiramisu', harga:10000},
        {label:'Coklat', harga:10000},
        {label:'Taro', harga:10000},
        {label:'Durian', harga:10000},
        {label:'Green Tea', harga:10000},   
        {label:'Strawberry', harga:10000},
        {label:'Keju Susu', harga:11000}, 
        {label:'Coklat Kacang', harga:12000},
        {label:'Coklat Almond', harga:14000}, 
        {label:'Milo Susu', harga:11000},
        {label:'Gratis', harga:0}
    ],
    tako: [
        {label:'Tako Small', harga:10000},
        {label:'Tako Medium', harga:18000},
        {label:'Tako Large', harga:25000},
        {label:'Gratis', harga:0}
    ],
    kopi: [
        {label:'Americano', harga:6000},
        {label:'Americano Double', harga:8000},
        {label:'Coffe Milk', harga:7000},
        {label:'Coffe Aren', harga:8000},
        {label: 'Coffe Rimba', harga:11000},
        {label:'Coffe Milo', harga:10000},
        {label:'Coffe Honey', harga:10000},
        {label:'Coffe Latte', harga:10000},
        {label:'Vanilla Latte', harga:12000},
        {label:'Hazelnut Latte', harga:12000},
        {label:'Salted Caramel', harga:12000},
        {label:'Fresh Milk', harga:8000},
        {label:'Chocolate', harga:8000},
        {label:'Manggo', harga:8000},
        {label:'Strawberry', harga:8000},
        {label:'Taro', harga:8000},
        {label:'Thai tea', harga:8000},
        {label:'Milo', harga:9000},
        {label:'Matcha', harga:9000},
        {label:'Gratis', harga:0}
    ]
};

// 2. CORE UTILITIES
function updateProfileDisplay() {
    const nama = document.getElementById('p_nama').value;
    const role = document.getElementById('p_outlet').value;
    document.getElementById('display-name').innerText = nama || "Nama Staff";
    document.getElementById('display-role').innerText = role || "Outlet Belum Dipilih";
}

setInterval(() => {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString('id-ID') + " WIB";
    const timeVal = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    if(document.getElementById('p_time')) document.getElementById('p_time').value = timeVal;
    if(document.getElementById('p_tgl')) document.getElementById('p_tgl').value = now.toISOString().split('T')[0];
}, 1000);

function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tabName).style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
}

function formatRupiahInput(input) {
    let val = input.value.replace(/[^0-9]/g, "");
    input.value = val ? "Rp " + parseInt(val).toLocaleString('id-ID') : "";
}

function cleanNumber(val) { 
    return parseInt(val.toString().replace(/[^0-9]/g, "")) || 0; 
}

// 3. DATABASE COMMUNICATION
// Fungsi Kirim ke Google Sheet yang diperbaiki (mendukung async/await)
// Perbaikan pada Event Listener Absen
document.getElementById("absenForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Ambil value dengan benar
    const nama = document.getElementById("p_nama").value;
    const outlet = document.getElementById("p_outlet").value; // Pastikan ID ini benar
    const jam = document.getElementById("p_time").value;
    const modal = document.getElementById("p_rupiah").value;
    const tanggal = document.getElementById("p_tgl").value;

    // SINKRONKAN NAMA PROPERTI DENGAN GOOGLE SCRIPT
    const payload = {
        sheet: "Absensi",
        tanggal: tanggal,
        waktu: jam,
        nama_staff: nama,
        outlet: outlet,
        keterangan: "Check-In",
        nominal: modal
    };

    // Tambahkan alert agar staff tahu proses sedang berjalan
    alert("Sedang mengirim absensi...");
    
    const isSuccess = await sendToGoogleSheet(payload);

    if (isSuccess) {
        const waPesan = `*CHECK-IN STAFF*\n👤 Nama: ${nama}\n🏠 Outlet: ${outlet}\n🕒 Jam: ${jam}\n💰 Modal: ${modal}`;
        window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(waPesan)}`, "_blank");

        document.getElementById('notif-absen').style.display = 'block';
        setTimeout(() => openTab(null, 'tab-penjualan'), 1500);
    } else {
        alert("Gagal mengirim data ke sistem. Cek koneksi internet.");
    }
});
async function sendToGoogleSheet(payload) {
    const formData = new URLSearchParams();
    for (const key in payload) { formData.append(key, payload[key]); }
    
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script memerlukan no-cors
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        return true;
    } catch (e) {
        console.error("Error sending data:", e);
        return false;
    }
}

// Fungsi Generate Laporan yang Diperbaiki
async function generateSales(type) {
    const namaStaff = document.getElementById('p_nama').value;
    const outlet = document.getElementById('p_outlet').value;
    const tanggal = document.getElementById('p_tgl').value;
    const totalNet = document.getElementById(`total-display-${type}`).value;

    if (!namaStaff || outlet === "") { 
        alert("Mohon lengkapi Nama Staff dan Outlet di tab Check-In!"); 
        openTab(null, 'tab-absen');
        return; 
    }

    // Nama Sheet Dinamis: Penjualan_pancong, Penjualan_tako, Penjualan_kopi
    const sheetName = "Penjualan_" + type;
    
    const wrapper = document.getElementById(`batch-wrapper-${type}`);
    const rows = wrapper.querySelectorAll('.porsi-row');
    let dataKeSheet = [];
    let teksWA = `*LAPORAN ${type.toUpperCase()}*\n👤 Staff: ${namaStaff}\n🏠 Outlet: ${outlet}\n📅 Tgl: ${tanggal}\n━━━━━━━━━━━━\n`;

    rows.forEach((row) => {
        // Hanya ambil data yang sudah dicentang "Selesai"
        const isLocked = row.querySelector('.lock-check').checked;
        
        if (isLocked) {
            const menu = row.querySelector('.b_menu').value;
            const topping = row.querySelector('.b_topping').value;
            const metode = row.querySelector('.b_pay').value;
            const harga = row.querySelector('.b_money').value;
            const pembeli = row.querySelector('.b_pembeli').value || "-";
            const waktu = row.querySelector('.b_waktu_porsi').value;
            const kematangan = row.querySelector('.b_kematangan').value;

            const item = {
                sheet: sheetName, // Parameter utama untuk Google Apps Script
                tanggal: tanggal,
                waktu: waktu,
                nama_staff: namaStaff,
                outlet: outlet,
                pembeli: pembeli,
                menu: menu,
                topping: topping,
                kematangan: kematangan,
                metode: metode,
                harga: harga
            };
            
            dataKeSheet.push(item);
            teksWA += `• ${menu} (${topping}) - ${harga} [${metode}]\n`;
        }
    });

    if (dataKeSheet.length === 0) {
        alert("Tidak ada pesanan yang ditandai 'Selesai'!");
        return;
    }

    teksWA += `━━━━━━━━━━━━\n💰 *TOTAL SETORAN: ${totalNet}*`;

    // Proses Pengiriman ke Google Sheet
    alert("Sedang mengirim " + dataKeSheet.length + " data ke sistem...");
    
    let suksesCount = 0;
    for (const data of dataKeSheet) {
        const isSuccess = await sendToGoogleSheet(data);
        if (isSuccess) suksesCount++;
    }

    // Buka WhatsApp setelah pengiriman data selesai
    const waUrl = `https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(teksWA)}`;
    window.open(waUrl, "_blank");

    alert("Berhasil mengirim " + suksesCount + " baris ke " + sheetName);
}

// 4. ABSENSI HANDLER
document.getElementById("absenForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const nama = document.getElementById("p_nama").value;
    const jabatan = document.getElementById("p_outlet").value;
    const jam = document.getElementById("p_time").value;
    const modal = document.getElementById("p_rupiah").value;
    const tanggal = document.getElementById("p_tgl").value;

    sendToGoogleSheet({ sheet: "Absensi", nama, jabatan, jam, modal, tanggal });

    const waPesan = `*CHECK-IN STAFF*\n👤 Nama: ${nama}\n🏠 Outlet: ${jabatan}\n🕒 Jam: ${jam}\n💰 Modal: ${modal}`;
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(waPesan)}`, "_blank");

    document.getElementById('notif-absen').style.display = 'block';
    setTimeout(() => openTab(null, 'tab-penjualan'), 1500);
});

// 5. SALES LOGIC (PANCONG, TAKO, KOPI)
function addNewBatch(type) {
    batchCount++;
    const wrapper = document.getElementById(`batch-wrapper-${type}`);
    const labelUtama = type === 'kopi' ? 'SESI KOPI' : 'ADONAN';
    const labelSub = type === 'kopi' ? 'Tambah Cup' : 'Tambah Porsi';
    
    const div = document.createElement('div');
    div.className = `batch-container card type-${type}`;
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <strong style="color:#5D4037">🥣 ${labelUtama} #${batchCount}</strong>
            <button onclick="this.closest('.batch-container').remove(); calculateTotal('${type}')" style="color:red; border:none; background:none; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="time" class="b_jam_adon" value="${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}" style="flex:1">
            <input type="number" class="b_gram" placeholder="${type === 'kopi' ? 'Catatan' : 'Gramasi'}" style="flex:1">
        </div>
        <div id="porsi-list-${batchCount}"></div>
        <button class="btn-add" onclick="addPorsiToBatch(${batchCount}, '${type}')">+ ${labelSub}</button>`;
    wrapper.appendChild(div);
    addPorsiToBatch(batchCount, type);
}

function addPorsiToBatch(bId, type) {
    const container = document.getElementById(`porsi-list-${bId}`);
    const row = document.createElement('div');
    row.className = 'porsi-row';
    const menuOptions = MENUS[type].map(m => `<option value="${m.label}" data-price="${m.harga}">${m.label}</option>`).join('');
    const labelUnit = type === 'kopi' ? 'Cup' : 'Porsi';

    row.innerHTML = `
        <div style="display:grid; gap:8px;">
            <div style="display:flex; gap:5px;">
                <input type="text" class="b_pembeli" placeholder="Nama Pembeli" style="flex:1">
                <input type="time" class="b_waktu_porsi" value="${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}">
            </div>
            <div style="display:flex; gap:5px;">
                <select class="b_menu" onchange="updatePrice(this, '${type}')" style="flex:1">
                    <option value="" data-price="0">- Menu -</option>
                    ${menuOptions}
                </select>
                <select class="b_topping" onchange="updatePrice(this, '${type}')" style="flex:1">
                    ${LIST_TOPPING.map(t => `<option value="${t.label}" data-price="${t.harga}">${t.label}</option>`).join('')}
                </select>
            </div>
            <div style="display:flex; gap:5px;">
                <select class="b_kematangan" style="flex:1; background:#FFF3E0;">
                    <option value="Normal">Normal</option>
                    ${type === 'pancong' ? '<option value="Lumer">🔥 Lumer</option>' : ''}
                    <option value="Matang">Matang</option>
                </select>
                <select class="b_pay" onchange="calculateTotal('${type}')" style="flex:1">
                    <option>Tunai</option><option>QRIS</option>
                </select>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding-top:8px; border-top:1px dashed #ddd;">
                <input type="text" class="b_money" value="Rp 0" readonly style="flex:1; background:#FFF9C4; font-weight:bold; text-align:center;">
                <label style="flex:1.2; display:flex; align-items:center; justify-content:center; gap:8px; background:#f0f0f0; padding:10px; border-radius:10px; cursor:pointer;">
                    <input type="checkbox" class="lock-check" onchange="toggleLock(this, '${type}')"> 
                    <span style="font-size:0.7rem; font-weight:bold;">${labelUnit} Selesai</span>
                </label>
            </div>
        </div>`;
    container.appendChild(row);
}

function updatePrice(el, type) {
    const row = el.closest('.porsi-row');
    const mPrice = parseInt(row.querySelector('.b_menu').selectedOptions[0].dataset.price) || 0;
    const tPrice = parseInt(row.querySelector('.b_topping').selectedOptions[0].dataset.price) || 0;
    row.querySelector('.b_money').value = "Rp " + (mPrice + tPrice).toLocaleString('id-ID');
    calculateTotal(type);
}

function toggleLock(checkbox, type) {
    const row = checkbox.closest('.porsi-row');
    const inputs = row.querySelectorAll('input:not(.lock-check), select');
    if (checkbox.checked) {
        if (row.querySelector('.b_menu').value === "") { alert("Pilih menu!"); checkbox.checked = false; return; }
        row.classList.add('locked');
        inputs.forEach(el => el.disabled = true);
    } else {
        row.classList.remove('locked');
        inputs.forEach(el => el.disabled = false);
    }
    calculateTotal(type);
}

function calculateTotal(type) {
    let total = 0;
    const wrapper = document.getElementById(`batch-wrapper-${type}`);
    if(wrapper) {
        wrapper.querySelectorAll('.lock-check:checked').forEach(chk => {
            const row = chk.closest('.porsi-row');
            total += cleanNumber(row.querySelector('.b_money').value);
        });
    }
    const keluarInput = document.getElementById(`p_keluar_${type}`);
    const keluar = keluarInput ? cleanNumber(keluarInput.value) : 0;
    const display = document.getElementById(`total-display-${type}`);
    if(display) display.value = "Rp " + (total - keluar).toLocaleString('id-ID');
}

async function generateSales(type) {
    const namaStaff = document.getElementById('p_nama').value;
    const outlet = document.getElementById('p_outlet').value;
    const tanggal = document.getElementById('p_tgl').value;
    const totalNet = document.getElementById(`total-display-${type}`).value;

    if (!namaStaff) { alert("Isi nama staff di tab Check-In!"); return; }

    let teksWA = `*LAPORAN ${type.toUpperCase()}*\n👤 Staff: ${namaStaff}\n🏠 Outlet: ${outlet}\n📅 Tgl: ${tanggal}\n━━━━━━━━━━━━\n`;
    const batches = document.querySelectorAll(`#batch-wrapper-${type} .batch-container`);
    let dataList = [];

    batches.forEach((batchRow, i) => {
        batchRow.querySelectorAll('.porsi-row').forEach((row, j) => {
            if (row.querySelector('.lock-check').checked) {
                const item = {
                    sheet: `Penjualan_${type}`,
                    tanggal: tanggal,
                    nama_staff: namaStaff,
                    outlet: outlet,
                    no_batch: i + 1,
                    menu: row.querySelector('.b_menu').value,
                    topping: row.querySelector('.b_topping').value,
                    metode: row.querySelector('.b_pay').value,
                    harga: row.querySelector('.b_money').value
                };
                dataList.push(item);
                teksWA += `• ${item.menu} - ${item.harga}\n`;
            }
        });
    });

    if (dataList.length === 0) { alert("Belum ada data yang diselesaikan!"); return; }

    teksWA += `\n━━━━━━━━━━━━\n💰 *TOTAL NET: ${totalNet}*`;
    
    // Kirim data parallel
    dataList.forEach(data => sendToGoogleSheet(data));
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(teksWA)}`, "_blank");
}

// 6. CALCULATOR LOGIC
let calcExpression = "";
function toggleCalc() { 
    const box = document.getElementById('calc-box'); 
    box.style.display = box.style.display === 'none' ? 'block' : 'none'; 
}
function calcInput(v) { calcExpression += v; updateCalcDisplay(); }
function calcClear() { calcExpression = ""; updateCalcDisplay(); }
function calcDel() { calcExpression = calcExpression.slice(0, -1); updateCalcDisplay(); }
function calcEqual() {
    try {
        let result = eval(calcExpression);
        calcExpression = result.toString();
        updateCalcDisplay();
    } catch { 
        document.getElementById('calc-display').innerText = "Error"; 
        calcExpression = ""; 
    }
}
function updateCalcDisplay() { document.getElementById('calc-display').innerText = calcExpression || "0"; }
// Perbaikan pada Event Listener Absen
document.getElementById("absenForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Ambil value dengan benar
    const nama = document.getElementById("p_nama").value;
    const outlet = document.getElementById("p_outlet").value; // Pastikan ID ini benar
    const jam = document.getElementById("p_time").value;
    const modal = document.getElementById("p_rupiah").value;
    const tanggal = document.getElementById("p_tgl").value;

    // SINKRONKAN NAMA PROPERTI DENGAN GOOGLE SCRIPT
    const payload = {
        sheet: "Absensi",
        tanggal: tanggal,
        waktu: jam,
        nama_staff: nama,
        outlet: outlet,
        keterangan: "Check-In",
        nominal: modal
    };

    // Tambahkan alert agar staff tahu proses sedang berjalan
    alert("Sedang mengirim absensi...");
    
    const isSuccess = await sendToGoogleSheet(payload);

    if (isSuccess) {
        const waPesan = `*CHECK-IN STAFF*\n👤 Nama: ${nama}\n🏠 Outlet: ${outlet}\n🕒 Jam: ${jam}\n💰 Modal: ${modal}`;
        window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(waPesan)}`, "_blank");

        document.getElementById('notif-absen').style.display = 'block';
        setTimeout(() => openTab(null, 'tab-penjualan'), 1500);
    } else {
        alert("Gagal mengirim data ke sistem. Cek koneksi internet.");
    }
});