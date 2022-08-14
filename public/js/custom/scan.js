let date = new Date();
let currDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0);
document.getElementById('transDate').value = currDate
let categorys = [];

async function begin() {
  await getCategorys()      // get designs list api call
}
begin()


// Get Category Name by ID
function getCategoryNameByID(id) {
  let categoryID = id
  let category = categorys.rows
  let categoryName
  for (let i = 0; i < categorys.count; i++) {
      if (categoryID === category[i].id) {
          categoryName = category[i].categoryName
      }
  }
  return categoryName
}

async function getCategorys() {
  try {
      let response = await fetch(api_endpoint + 'category/list/all', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
      })
      let data = await response.json()
      if (response.status == 200) {
          if (data.status) {
              categorys = data.data
          }
          else {
              toastr.error(data.message)
          }
      }
  }
  catch (err) {
      console.log(err)
      toastr.error('Something went wrong')
  }
}

async function addDesignByNumber() {
  try {
    let skuNumber = document.getElementById('designNo').value
    let designArr = []
    if (skuNumber) {
      let response = await fetch(api_endpoint + 'design/designno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "skuNumber": skuNumber })
      })
      let data = await response.json()
      if (response.status == 200) {
        if (data.status) {
          let newDesign = data.data
          let rowCount = $('#designResult').find('tr').length
          if (newDesign) {
            let imageName = newDesign.imageName === null ? images_endpoint + 'noimage.png' : newDesign.imageName
            let categoryName = newDesign.categoryId === null ? '' : getCategoryNameByID(newDesign.categoryId)
            let grossWt = newDesign.grossWt === null ? '' : newDesign.grossWt
            let stoneWt = newDesign.stoneWt === null ? '' : newDesign.stoneWt
            let beadWt = newDesign.beadWt === null ? '' : newDesign.beadWt
            let extraStoneWt = newDesign.extraStoneWt === null ? '' : newDesign.extraStoneWt
            let netWt = newDesign.netWt === null ? '' : newDesign.netWt
            let code = newDesign.code === null ? '' : newDesign.code
            let color = newDesign.color === null ? '' : newDesign.color
            let purity = newDesign.purity === null ? '' : newDesign.purity
            let designDate = moment((newDesign.createdAt).split('T')[0]).format('DD-MM-YYYY')
            var t = document.getElementById("designResultBody");
            var trs = t.getElementsByTagName("tr");
            var tds = null;

            for (var i = 0; i < trs.length; i++) {
              tds = trs[i].getElementsByTagName("td");
              designArr.push(tds[2].textContent)
            }

            if (designArr.indexOf(newDesign.designNumber) === -1) {
              $('#designResult tbody').append('<tr> <td>' + rowCount + '</td> <td> <img src="' + images_endpoint + imageName + '" width="80px" height="80px" onerror="this.src=' + "'" + images_endpoint + "noimage.png" + "'" + '" /> </td> <td id="designCode">' + newDesign.designNumber + '</td> <td>' + categoryName + '</td> <td>' + grossWt + '</td> <td> ' + code + ' </td> <td>' + color + '</td> <td>' + purity + '</td> <td>' + designDate + '</td> <td>' + '<button type="button" class="btn btn-danger btn-sm btnDelete" data-toggle="tooltip"><i class="far fa-trash-alt" aria-hidden="true"></i></button> </td></tr>');
            }
          }
        } else {
          toastr.error(data.message)
        }
        document.getElementById('designNo').value = "";
      }
    } else {
      toastr.error('Please Enter the Design Code Correctly')
    }
  } catch (err) {
    console.log(err)
  }
}
// Print PDF sending data to Server
$(document).ready(function () {
  $('.loading').hide();
  $('#printPDF').click(function () {
    var t = document.getElementById("designResultBody");
    var trs = t.getElementsByTagName("tr");
    var tds = null;
    let designArr = []
    if (trs.length < 1) {
      toastr.error("Please Add The Item List First")
      return
    }
    $('.loading').show();

    for (var i = 0; i < trs.length; i++) {
      tds = trs[i].getElementsByTagName("td");
      designArr.push(tds[2].textContent)
    }
    let cust_sales_name = $('select#cust_sales_name option:selected').text()
    if (cust_sales_name === 'Select Customer/Salesman') { $('.loading').hide(); return toastr.error('Please select customer/salesman') }
    // let cust_sales_name = document.getElementById('cust_sales_name').value
    let selectedDate = document.getElementById('transDate').value
    let transDate
    if (selectedDate === "") {
      transDate = date.getDate().toString().padStart(2, 0) + '-' +  (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getFullYear().toString();
    } else {
      transDate = selectedDate
    }
    let stonePrice = $('#stonePrice').val();
    let customerName = $('#customerName').val();
    let percentage = $('#percent').val();
    let itemStatus = $('select#itemStatus option:selected').val();
    let body = { designList: designArr, stonePrice, itemStatus, customerName, percentage, transDate }
    let url = 'generatePDF'
    cust_sales_name = customerName === "" ? "Design" : customerName
    fetch(api_endpoint + 'design/' + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
      .then(response => response.blob())
      .then(response => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = cust_sales_name + "-" + getFormattedTime() + ".pdf";
        document.body.appendChild(a);
        a.click();
      })

    $('.loading').hide();
  })

  $("#designResultBody").on('click', '.btnDelete', function () {
    $(this).closest('tr').remove();
  });

})

function getFormattedTime() {
  var today = new Date();
  var y = today.getFullYear();
  // JavaScript months are 0-based.
  var m = today.getMonth() + 1;
  var d = today.getDate();
  var h = today.getHours();
  var mi = today.getMinutes();
  var s = today.getSeconds();
  return d + "-" + m + "-" + y + "-" + h + "-" + mi + "-" + s;
}

$('#transSubType').on('change', function () {
  let transSubType = $('option:selected', '#transSubType').val()
  if (transSubType != 'Issue') {
    $('#billNo').val('')
    $('#deleteIssueDesign').prop('checked', false)
  }
})

async function updateStatusSalesCustomer() {
  var t = document.getElementById("designResultBody")
  var trs = t.getElementsByTagName("tr");
  var tds = null;
  let body
  let designArr = [], designDate = []
  for (var i = 0; i < trs.length; i++) {
    tds = trs[i].getElementsByTagName("td")
    designArr.push(tds[2].textContent)
    designDate.push(tds[8].textContent)
  }
  let customerName = $('#customerName').val() === null || $('#customerName').val() === '' ? "" : $('#customerName').val()
  let transDate = $('#transDate').val()
  let itemStatus = $('option:selected', '#itemStatus').val()
  body = { designList: designArr, customerName, itemStatus, transDate }
  console.log(body)
  let reportDate = new Date(transDate)
  let isValid = false
  let errorArr = []
  let anyValid = true
  for (let j = 0; j < designDate.length; j++) {
    let arrDate = designDate[j];
    arrDate = arrDate.split('-');
    arrDate = new Date(arrDate[2], parseInt(arrDate[1]) - 1, arrDate[0])
    if (arrDate <= reportDate) {
      isValid = true
    } else {
      errorArr.push(designArr[j])
      isValid = false
      anyValid = false
    }
  }

  if (transDate != "") {
    if (anyValid) {
      $('.loading').show();
      let response = await fetch(api_endpoint + 'design/updatestatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      let data = await response.json()
      if (response.status == 200) {
        if (data.data) {
          $('.loading').hide();
          toastr.success(data.message)
          let designList = data.data;
          if (designList.length > 0) {
            $("#designResultBody").empty();
            for (let i = 0; i < designList.length; i++) {
              let rowCount = $('#designResult').find('tr').length
              let designDate = moment((designList[i].createdAt).split('T')[0]).format('DD-MM-YYYY')
              let imageName = designList[i].imageName === null ? images_endpoint + 'noimage.png' : designList[i].imageName;
              $('#designResult tbody').append('<tr> <td>' + rowCount + '</td> <td> <img src="' + images_endpoint + imageName + '" width="80px" height="80px" onerror="this.src=' + "'" + images_endpoint + "noimage.png" + "'" + '" /> </td> <td id="designCode">' + designList[i].designNumber + '</td> <td>' + designList[i].category.categoryName + '</td> <td>' + designList[i].grossWt + '</td> <td> ' + designList[i].code + ' </td> <td>' + designList[i].color + '</td> <td>' + designList[i].purity + '</td> <td>' + designDate + '</td> <td>' + '<button type="button" class="btn btn-danger btn-sm btnDelete" data-toggle="tooltip"><i class="far fa-trash-alt" aria-hidden="true"></i></button> </td></tr>');
            }
          } else {
            $("#designResultBody").empty();
          }
        }
        else {
          $('.loading').hide();
          toastr.error(data.message)
          return
        }
      }
    } else {
      $('.loading').hide();
      toastr.error(`Last transaction Date for Design Codes: ${errorArr} is after the selected date `)
    }
  } else {
    $('.loading').hide();
    toastr.error('Please Select Date')
  }
  $('.loading').hide()
}

async function getAccountByType() {
  let type = $('#upCustSalesType option:selected').val();
  if (type === null) {
    type = "Customer"
  }

  let response = await fetch(api_endpoint + 'account/' + type, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  let data = await response.json();
  data = data.data
  var cust_sales_name = $("#cust_sales_name");
  cust_sales_name.empty();
  cust_sales_name.append($("<option></option>").attr("value", "").text("Select Customer/Salesman"));
  if (response.status === 200) {
    if (data) {
      for (let i = 0; i < data.length; i++) {
        cust_sales_name.append($("<option></option>").attr("value", data[i].id).text(data[i].name));
      }
    }
  }
}
// getAccountByType()

$('#upCustSalesType').change(function () {
  getAccountByType()
})

function clearBarCodeForm() {
  $('.loading').show()
  $("#designResultBody tr").remove();
  // document.getElementById('transDate').value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0);
  // document.getElementById("transSubType").selectedIndex = 0;
  // document.getElementById("upCustSalesType").selectedIndex = 0;
  // document.getElementById("cust_sales_name").value = "";
  // getAccountByType()
  $('.loading').hide()
}

$('#transSubType').on('change', function () {
  let transSubType = $('option:selected', '#transSubType').val()
  if (transSubType === 'Issue') {
    document.querySelector('#billNo').disabled = false
  } else {
    document.querySelector('#billNo').disabled = true
  }
})

// Adjust modal to center of screen
$(document).ready(function () {
  function alignModal() {
    var modalDialog = $(this).find(".modal-dialog");

    // Applying the top margin on modal to align it vertically center
    modalDialog.css("margin-top", Math.max(0, ($(window).height() - modalDialog.height()) / 2));
  }
  // Align modal when it is displayed
  $(".modal").on("shown.bs.modal", alignModal);

  // Align modal when user resize the window
  $(window).on("resize", function () {
    $(".modal:visible").each(alignModal);
  });

  $("body").tooltip({ selector: '[data-toggle=tooltip]' });

});

$('#exportExcel').click(function () {
  try {
    $('#exportExcelModal').modal('show')
  } catch (error) {
    console.log(error)
  }
})

async function exportExcelDesigns() {
  try {
    let selectedValue = $('#exportExcelDrop option:selected').val()
    if (selectedValue === '') return toastr.error('Please select export option')
    await exportSelectedDesigns(selectedValue)
  } catch (error) {
    console.log(error)
  }
}

async function exportSelectedDesigns(selectedValue) {
  try {
    $('.loading').show();
    var t = document.getElementById("designResultBody");
    var trs = t.getElementsByTagName("tr");
    var tds = null;
    let designArr = []

    for (var i = 0; i < trs.length; i++) {
      tds = trs[i].getElementsByTagName("td");
      designArr.push(tds[2].textContent)
    }

    let body = { skuNumberList: designArr }
    let url
    if (selectedValue === 'selected') {
      if (trs.length < 1)
        return toastr.error("Please Add The Item List First")
      url = 'exporttoexcel'
    } else if (selectedValue === 'huid') {
      if (trs.length < 1)
        return toastr.error("Please Add The Item List First")
      url = 'exporttoexcelhuid'
    } else if (selectedValue === 'allinstock') {
      url = 'exporttoexcelallinstock'
    }
    fetch(api_endpoint + 'design/' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(response => response.blob())
      .then(response => {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "DesignsDistributor.xlsx";
        document.body.appendChild(a);
        a.click();
      })

  } catch (error) {
    console.log(error)
  } finally {
    $('.loading').hide()
    $('#exportExcelModal').modal('hide')
  }
}