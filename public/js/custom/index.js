let designs = [];
let categorys = [];
let base64String = '';
let selectedDesign;
let designFormFields = [
    {
        'displayName': 'Category Name',
        'fieldName': 'categoryId',
        'validations': [
            { 'type': 'required', 'message': 'Category Name is Required' }
        ]
    },
    {
        'displayName': 'Design Number',
        'fieldName': 'designNumber',
        'validations': [
            { 'type': 'required', 'message': 'Design Number is Required' },
            { 'type': 'alphanumeric', 'message': 'Design Number should be alphanumeric' }
        ]
    },
    {
        'displayName': 'Gross Weight',
        'fieldName': 'grossWt',
        'validations': [
            // { 'type': 'required', 'message': 'Gross Weight is Required' },
            { 'type': 'number', 'message': 'Gross Weight should be a number' },
            { 'type': 'max3decimal', 'message': 'Gross Weight can have 3 decimal only' }
        ]
    },
    {
        'displayName': 'Stone Weight',
        'fieldName': 'stoneWt',
        'validations': [
            // { 'type': 'required', 'message': 'Gross Weight is Required' },
            { 'type': 'number', 'message': 'Stone Weight should be a number' },
            { 'type': 'max3decimal', 'message': 'Stone Weight can have 3 decimal only' }
        ]
    },
    {
        'displayName': 'Beads Weight',
        'fieldName': 'beadWt',
        'validations': [
            // { 'type': 'required', 'message': 'Gross Weight is Required' },
            { 'type': 'number', 'message': 'Beads Weight should be a number' },
            { 'type': 'max3decimal', 'message': 'Beads Weight can have 3 decimal only' }
        ]
    },
    {
        'displayName': 'Extra Stone Weight',
        'fieldName': 'extraStoneWt',
        'validations': [
            // { 'type': 'required', 'message': 'Gross Weight is Required' },
            { 'type': 'number', 'message': 'Extra Stone Weight should be a number' },
            { 'type': 'max3decimal', 'message': 'Extra Stone Weight can have 3 decimal only' }
        ]
    },
    {
        'displayName': 'Net Weight',
        'fieldName': 'netWt',
        'validations': [
            // { 'type': 'required', 'message': 'Net Weight is Required' },
            { 'type': 'number', 'message': 'Net Weight should be a number' },
            { 'type': 'max3decimal', 'message': 'Net Weight can have 3 decimal only' }
        ]
    },
    {
        'displayName': 'Code',
        'fieldName': 'code',
        'validations': [
            // { 'type': 'required', 'message': 'Colour is Required' },
            // { 'type': 'alphabet', 'message': 'Code can have alphabets only' }
        ]
    },
    {
        'displayName': 'Colour',
        'fieldName': 'color',
        'validations': [
            // { 'type': 'required', 'message': 'Colour is Required' },
            { 'type': 'alphabet', 'message': 'Colour can have alphabets only' }
        ]
    },
    {
        'displayName': 'Purity',
        'fieldName': 'purity',
        'validations': [
            // { 'type': 'required', 'message': 'Metal Purity is Required' },
            { 'type': 'number', 'message': 'Purity should be a number' }
        ]
    },
]

async function begin() {
    await getCategorys()    // get categories list api call
    await getDesigns()      // get designs list api call
    setDataTable()          // set designs list in datatable
    await getTotalByStatus()
}

function encodeImageFileAsURL(fileobejct) {
    var fileReader = new FileReader();
    fileReader.addEventListener("load", function (fileLoadedEvent) {
        var srcData = fileLoadedEvent.target.result; // <--- data: base64
        base64String = srcData;
    })
    fileReader.readAsDataURL(fileobejct);
    return base64String
}

$('#addDesignModal #imageName').on('change', async function () {
    try {
        let fileInput = $(this)[0].files[0];
        base64String = encodeImageFileAsURL(fileInput);
    } catch (error) {
        console.log(error)
    }
})

$('#updateDesignModal #imageName').on('change', async function () {
    try {
        let fileInput = $(this)[0].files[0];
        base64String = encodeImageFileAsURL(fileInput);
    } catch (error) {
        console.log(error)
    }
})

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

function getCategoryPrefixByID(id) {
    let categoryId = id
    let category = categorys.rows
    let categoryPrefix
    for (let i = 0; i < categorys.count; i++) {
        if (categoryId === category[i].id) {
            categoryPrefix = category[i].categoryPrefix
        }
    }
    return categoryPrefix
}


let codeObj = ["Y", "K", "A", "N", "P", "U", "R", "C", "I", "T"]
function calcSeventyPercentWeight(modal) {
    let stoneWt = isNaN(parseFloat($(modal + ' #stoneWt').val())) ? 0 : parseFloat($(modal + ' #stoneWt').val())
    let beadWt = isNaN(parseFloat($(modal + ' #beadWt').val())) ? 0 : parseFloat($(modal + ' #beadWt').val())
    let extraStoneWt = isNaN(parseFloat($(modal + ' #extraStoneWt').val())) ? 0 : parseFloat($(modal + ' #extraStoneWt').val())
    let seventyPercentStoneWt = 0;
    seventyPercentStoneWt = ((stoneWt + beadWt + extraStoneWt) * 0.7).toFixed(2);
    seventyPercentStoneWtSplit = String(seventyPercentStoneWt).split('').map(str => isNaN(Number(str)) ? str : Number(str));
    let code = seventyPercentStoneWtSplit.map((num) => codeObj[num] == undefined ? '.' : codeObj[num])
    $(modal + ' #code').val(code.join(""))

    let grossWt = isNaN(parseFloat($(modal + ' #grossWt').val())) ? 0 : parseFloat($(modal + ' #grossWt').val())
    let netWt = grossWt - seventyPercentStoneWt
    $(modal + ' #netWt').val(netWt.toFixed(3))
    return seventyPercentStoneWt
}

document.getElementById('select-all').onclick = function () {
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (var checkbox of checkboxes) {
        checkbox.checked = this.checked;
    }
}


$('#addDesignModal #categoryId').on('change', function () {
    getDesignNumberByCategory("#addDesignModal", $("#addDesignModal #categoryId").val())
})

$('#updateDesignModal #categoryId').on('change', function () {
    getDesignNumberByCategory("#updateDesignModal", $("#updateDesignModal #categoryId").val())
})

async function getDesignNumberByCategory(modal, id) {
    try {
        let response = await fetch(api_endpoint + 'design/designnobycategory/', {
            method: 'POST',
            body: JSON.stringify({ categoryId: id }),
            headers: { 'Content-Type': 'application/json' }
        })
        let data = await response.json()
        if (response.status == 200) {
            if (data.status) {
                designNumber = data.data
                $(modal + ' #designNumber').val(designNumber)
            }
            else {
                toastr.error(data.message)
            }
        }
    } catch (error) {
        console.log(error)
    }
}

async function getDesigns() {
    try {
        let response = await fetch(api_endpoint + 'design/list/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        let data = await response.json()
        if (response.status == 200) {
            if (data.status) {
                designs = data.data
                designs.rows.map(design => { design.createdAt = new Date(design.createdAt).toLocaleString() })
            }
            else {
                toastr.error(data.message)
            }
        }
        else if (response.status == 401) {
            notAuthenticated()
        }
        else if (response.status == 410) {
            toastr.error('Error in Request')
        }
        else {
            toastr.error('Something went wrong')
        }

    }
    catch (err) {
        console.log(err)
        toastr.error('Something went wrong')
    }

}

async function getCategorys() {
    try {
        let response = await fetch(api_endpoint + 'category/list/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        let data = await response.json()
        if (response.status == 200) {
            if (data.status) {
                categorys = data.data
                $.each(categorys.rows, function (key, value) {
                    $('#addDesignModal #categoryId').append($("<option></option>").attr("value", value.id).text(value.categoryName));
                    $('#updateDesignModal #categoryId').append($("<option></option>").attr("value", value.id).text(value.categoryName));
                    $('#DateTableDesignList #categoryId').append($("<option></option>").attr("value", value.id).text(value.categoryName));
                })
            }
            else {
                toastr.error(data.message)
            }
        }
        else if (response.status == 401) {
            notAuthenticated()
        }
        else if (response.status == 410) {
            toastr.error('Error in Request')
        }
        else {
            toastr.error('Something went wrong')
        }
    }
    catch (err) {
        console.log(err)
        toastr.error('Something went wrong')
    }
}

async function setDataTable() {
    var table = $('#dataTable').DataTable({
        "data": designs.rows,
        "columnDefs": [
            { "className": "dt-center", "targets": "_all" }
        ],
        "columns": [
            {
                "orderable": false,
                "data": null,
                "width": "5%",
                "render": function (data, type, row) {
                    return '<input type="checkbox" id="checkbox_' + row.id + '" name="designSelect" style="width: 1em;height: 1em;margin-top: 7px;">';
                }
            },
            {
                "width": "5%",
                "render": function (data, type, full, meta) {
                    return meta.row + 1;
                }
            },
            {
                "width": "10%",
                "data": "designNumber",
            },
            {
                data: "imageName",
                render: function (data, type, row) {
                    if (data) {
                        return (
                            '<img id="imageOpen" src="' + images_endpoint + row.imageName + '" onerror="this.src=' + "'" + images_endpoint + "noimage.png" + "'" + '" width="80px" height="80px" alt="' + row.imageName + '" onclick="onClick(this)" loading="lazy"  />'
                        );
                    }
                },
            },
            {
                "data": "categoryId",
                "render": function (data) {
                    return getCategoryNameByID(data)
                }
            },
            {
                "data": "grossWt",
            },
            {
                "data": "purity",
            },
            {
                "data": "code",
            },
            {
                "data": "itemStatus"
            },
            {
                "orderable": false,
                "width": "10%",
                "data": null,
                "render": function (data, type, row) {
                    return '<button id="update_button" style= "margin-right:4px;" type="button" class="btn btn-info btn-sm" data-toggle="tooltip" title="Update Design"><i class="fas fa-pencil-alt" aria-hidden="true"></i></button>' +
                        '<button id="delete_button" type="button" class="btn btn-danger btn-sm" data-toggle="tooltip" title="Delete Design"><i class="far fa-trash-alt" aria-hidden="true"></i></button>';
                }
            },
        ],
        "fnRowCallback": function (nRow, aData) {
            if (aData.itemStatus == "Approval") {
                $('td', nRow).css('color', 'Red');
            }
        }
        // "order": [[1, 'asc']]
    });

    $('#dataTable tbody').on('click', 'button', async function () {
        let action = this.id;
        let tr = $(this).closest('tr');
        let row = table.row(tr);

        // console.log(action)
        // console.log(row.data())

        if (action == 'update_button') {
            selectedDesign = row.data()
            document.querySelector('#updateDesignModal .modal-body > .card-body #designNumber').value = selectedDesign.designNumber
            document.querySelector('#updateDesignModal .modal-body > .card-body #categoryId').value = selectedDesign.categoryId
            document.querySelector('#updateDesignModal .modal-body > .card-body #grossWt').value = selectedDesign.grossWt
            document.querySelector('#updateDesignModal .modal-body > .card-body #stoneWt').value = selectedDesign.stoneWt
            document.querySelector('#updateDesignModal .modal-body > .card-body #beadWt').value = selectedDesign.beadWt
            document.querySelector('#updateDesignModal .modal-body > .card-body #extraStoneWt').value = selectedDesign.extraStoneWt
            document.querySelector('#updateDesignModal .modal-body > .card-body #netWt').value = selectedDesign.netWt
            document.querySelector('#updateDesignModal .modal-body > .card-body #code').value = selectedDesign.code
            document.querySelector('#updateDesignModal .modal-body > .card-body #color').value = selectedDesign.color
            document.querySelector('#updateDesignModal .modal-body > .card-body #purity').value = selectedDesign.purity

            // validate design
            for (let i = 0; i < designFormFields.length; i++) {
                const formField = designFormFields[i];
                await validateForm('updateDesignModal', formField.fieldName, true)
            }
            $('#updateDesignModal').modal('show')
        }
        else if (action == 'delete_button') {
            selectedDesign = row.data()
            $('#deleteDesignModal').modal('show')
        }
    });
}

async function deleteDesign() {
    try {
        if (selectedDesign) {
            let response = await fetch(api_endpoint + 'design/' + selectedDesign.id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': localStorage.getItem('access_token')
                }
            })
            let data = await response.json()
            console.log(data)
            if (response.status == 200) {
                if (data.status) {
                    await getDesigns()
                    console.log(designs)
                    var table = $('#dataTable').DataTable()
                    table.clear();
                    table.rows.add(designs.rows);
                    table.draw(false);
                    await getTotalByStatus()
                    toastr.success(data.message)
                }
                else {
                    toastr.error(data.message)
                }
            }
            else if (response.status == 401) {
                notAuthenticated()
            }
            else if (response.status == 410) {
                toastr.error('Error in Request')
            }
            else {
                toastr.error('Something went wrong')
            }
        }
    }
    catch (err) {
        console.log(err)
        toastr.error('Something went wrong')
    }
    finally {
        $('#deleteDesignModal').modal('hide')
    }
}

async function updateDesign() {
    try {
        let valid = true;
        let fieldNames = [];
        for (let i = 0; i < designFormFields.length; i++) {
            const formField = designFormFields[i];
            fieldNames.push(formField.fieldName)
            let newValidation = await validateForm('updateDesignModal', formField.fieldName)
            console.log(valid)
            console.log(newValidation)
            valid = valid && newValidation
        }
        if (valid && selectedDesign) {
            let body = {}
            let value;
            fieldNames.forEach(field => {
                value = document.querySelector('#updateDesignModal #' + field).value
                if (value != undefined && value != null && value != '')
                    body[field] = value
            });
            if (base64String != "") {
                body.imageName = base64String
            }
            let seventyStoneWt = calcSeventyPercentWeight('#updateDesignModal')
            if (seventyStoneWt)
                body.seventyStoneWt = seventyStoneWt
            let response = await fetch(api_endpoint + 'design/' + selectedDesign.id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': localStorage.getItem('access_token')
                },
                body: JSON.stringify(body)
            })
            let data = await response.json()
            console.log(data)
            if (response.status == 200) {
                if (data.status) {
                    await getDesigns()
                    var table = $('#dataTable').DataTable()
                    table.clear();
                    table.rows.add(designs.rows);
                    table.draw(false);
                    await getTotalByStatus()
                    toastr.success(data.message)
                    base64String = ""
                    $('#updateDesignModal #imageName').val('')
                }
                else {
                    toastr.error(data.message)
                    return
                }
                $('#updateDesignModal').modal('hide')
                return true;
            }
            else if (response.status == 401) {
                notAuthenticated()
            }
            else if (response.status == 410) {
                toastr.error('Error in Request')
            }
            else {
                toastr.error('Something went wrong')
            }
            $('#updateDesignModal').modal('hide')
        }
    }
    catch (err) {
        console.log(err)
        toastr.error('Something went wrong')
    }
    finally {
        // $('#updateClientModal').modal('hide')
    }
}


async function addDesignByNumber() {
    try {
        let designNo = document.getElementById('designNo').value

        if (designNo) {
            let response = await fetch(api_endpoint + 'design/designno', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': localStorage.getItem('access_token')
                },
                body: JSON.stringify({ "designNo": designNo })
            })
            let data = await response.json()
            if (response.status == 200) {

                if (data.status) {
                    let newDesign = data.data
                    let rowCount = $('#designResult').find('tr').length
                    if (newDesign) {
                        let huid = newDesign.huid === null ? '' : newDesign.huid
                        let grossWeight = newDesign.grossWeight === null ? '' : newDesign.grossWeight
                        let netWeight = newDesign.netWeight === null ? '' : newDesign.netWeight
                        let metalPurity = newDesign.metalPurity === null ? '' : newDesign.metalPurity
                        let stoneCount = newDesign.stoneCount === null ? '' : newDesign.stoneCount
                        let stoneWeight = newDesign.stoneWeight === null ? '' : newDesign.stoneWeight
                        let colourStoneWeight = newDesign.colourStoneWeight === null ? '' : newDesign.colourStoneWeight
                        $('#designResult tbody').append('<tr> <td>' + rowCount + '</td> <td id="designNumber">' + newDesign.designNumber + '</td> <td id="designNumber">' + huid + '</td> <td>' + grossWeight + '</td> <td>' + netWeight + '</td> <td>' + metalPurity + '</td> <td>' + stoneCount + '</td> <td>' + stoneWeight + '</td> <td>' + colourStoneWeight + '</td> <td>' + '<button type="button" class="btn btn-danger btn-sm btnDelete" data-toggle="tooltip"><i class="far fa-trash-alt" aria-hidden="true"></i></button> </td></tr>');
                        document.getElementById('designNo').value = ""
                    }
                } else {
                    toastr.error(data.message)
                }
            }
        } else {
            toastr.error('Please Enter the Design Number Correctly')
        }
    } catch (err) {
        console.log(err)
    }
}

// Reset Form after inserting
async function resetFormFields() {
    document.querySelector('#addDesignModal #designNumber').value = "";
    document.querySelector('#addDesignModal #grossWt').value = "";
    document.querySelector('#addDesignModal #stoneWt').value = "";
    document.querySelector('#addDesignModal #beadWt').value = "";
    document.querySelector('#addDesignModal #extraStoneWt').value = "";
    document.querySelector('#addDesignModal #netWt').value = "";
    document.querySelector('#addDesignModal #code').value = "";
    document.querySelector('#addDesignModal #color').value = "";
}

async function addDesign() {
    try {
        let valid = true;
        let fieldNames = [];
        for (let i = 0; i < designFormFields.length; i++) {
            const formField = designFormFields[i];
            fieldNames.push(formField.fieldName)
            let newValidation = await validateForm('addDesignModal', formField.fieldName)
            valid = valid && newValidation
        }
        if (valid) {
            let body = {}
            fieldNames.forEach(field => {
                if (document.querySelector('#addDesignModal #' + field).value == '')
                    body[field] = null
                else
                    body[field] = document.querySelector('#addDesignModal #' + field).value
            });
            if (base64String != "") {
                body.imageName = base64String
            }
            let seventyStoneWt = calcSeventyPercentWeight('#addDesignModal')
            if (seventyStoneWt)
                body.seventyStoneWt = seventyStoneWt
            let response = await fetch(api_endpoint + 'design/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': localStorage.getItem('access_token')
                },
                body: JSON.stringify(body)
            })
            let data = await response.json()
            let newDesign;
            if (response.status == 200) {
                if (data.status) {
                    newDesign = data.data
                    await getDesigns()
                    console.log(designs)
                    var table = $('#dataTable').DataTable()
                    table.clear();
                    table.rows.add(designs.rows);
                    table.draw(false);
                    await getTotalByStatus()
                    toastr.success(data.message)
                    base64String = '';
                    await resetFormFields()
                    await getDesignNumberByCategory('#addDesignModal', body.categoryId)
                    $('#addDesignModal #imageName').val('')
                }
                else {
                    toastr.error(data.message)
                    return
                }
                // $('#addDesignModal').modal('hide')
                return newDesign;
            }
            else if (response.status == 401) {
                notAuthenticated()
            }
            else if (response.status == 410) {
                toastr.error('Error in Request')
            }
            else {
                toastr.error('Something went wrong')
            }
        }
    }
    catch (err) {
        console.log(err)
        toastr.error('Something went wrong')
    }
}

async function addDesignModal() {
    // reset form fields
    for (let i = 0; i < designFormFields.length; i++) {
        const formField = designFormFields[i];

        await validateForm('addDesignModal', formField.fieldName)
        document.querySelector('#addDesignModal #' + formField.fieldName + '_error').innerHTML = ''
        let htmlElement = document.querySelector('#addDesignModal #' + formField.fieldName)
        htmlElement.classList.remove('border-invalid');
        htmlElement.classList.add('border-0');
        htmlElement.value = '';
    }
    $('#addDesignModal').modal('show')
}

async function printDesignsModal() {
    $('#printDesignModal').modal('show')
}
async function printDesigns() {
    // $('#printDesignModal').modal('show')
    const templateVal = $("#template :selected").val();
    console.log(templateVal)
    const checkboxes = document.querySelectorAll('input[name="designSelect"]:checked');
    console.log(checkboxes)

    if (checkboxes.length == 0) {
        toastr.error('No Design Selected')
    }
    else {
        let printIds = []
        checkboxes.forEach(checkbox => {
            printIds.push(checkbox.id.split('_')[1])
        })
        console.log(printIds)
        await printDesignsApi(printIds, templateVal)
    }
}

async function addDesignAndPrint() {
    let templateVal = $("#addTemplate :selected").val();
    let newDesign = await addDesign()
    console.log(newDesign)
    if (newDesign)
        await printDesignsApi([newDesign.id], templateVal)
}

async function updateDesignAndPrint() {
    let templateVal = $("#updateTemplate :selected").val()
    let updateStatus = await updateDesign();
    console.log(updateStatus)
    if (updateStatus)
        await printDesignsApi([selectedDesign.id], templateVal)
}

async function printDesignsApi(printIds, template) {
    console.log('printDesignsApi')
    $('#printDesignModal').modal('hide')
    if (template === '') {
        toastr.error('Please Select Printer Template')
        return
    }
    let body = { designIds: printIds, printerTemplate: template }
    let response = await fetch(api_endpoint + 'design/print/barcode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': localStorage.getItem('access_token')
        },
        body: JSON.stringify(body)
    })
    let data = await response.json()
    console.log(data)
    if (response.status == 200) {
        if (data.status) {
            toastr.success(data.message)
        }
        else {
            toastr.error(data.message)
            return
        }
    }
    else if (response.status == 401) {
        notAuthenticated()
    }
    else if (response.status == 410) {
        toastr.error('Error in Request')
    }
    else {
        toastr.error('Something went wrong')
    }
}

function validateDD(dd) {
    console.log('validateDD')
    let element = document.querySelector('#productFlavourdd')
    if (!selectedproductFlavour) {
        element.classList.add('border-invalid');
        element.classList.remove('border-0')
        document.querySelector('#productFlavour_error').innerHTML = 'Select Product Flavour'
        return false
    }
    else {
        element.classList.remove('border-invalid');
        element.classList.add('border-0')
        document.querySelector('#productFlavour_error').innerHTML = ''
        return true
    }
}

async function validateForm(form, field = null, validate = true) {
    // update Client
    // console.log('validateForm')
    for (let i = 0; i < designFormFields.length; i++) {
        const formField = designFormFields[i];
        if (formField.fieldName == field) {
            // console.log('#'+form+' #'+formField.fieldName)
            let element = document.querySelector('#' + form + ' #' + formField.fieldName)
            // console.log(validate)

            // don't do validations for password on update
            if (validate) {
                let valid = true
                for (let j = 0; j < formField.validations.length; j++) {
                    const validation = formField.validations[j];
                    if (valid && await allValidations(validation.type, element.value))
                        continue;

                    element.classList.add('border-invalid');
                    element.classList.remove('border-0')
                    let errorMessage = validation.message
                    document.querySelector('#' + form + ' #' + field + '_error').innerHTML = errorMessage
                    // console.log(errorMessage)
                    return false

                }
                document.querySelector('#' + form + ' #' + field + '_error')
                    .innerHTML = ''
                element.classList.remove('border-invalid');
                element.classList.add('border-0')
                return true;
            }
            else
                return true
        }

    }
    return true
}

async function allValidations(type, value) {
    if (type == 'required') {
        if (value !== '' && value !== undefined && value !== null)
            return true
        else
            return false
    }
    if (type == 'number') {
        if (isNaN(value))
            return false
        else
            return true
    }
    if (type == 'alphabet') {
        return value.trim() == '' ? true : value.match(/^[a-zA-Z]+$/) ? true : false;
    }
    if (type == 'alphanumeric') {
        return value.match(/^[0-9a-zA-Z]+$/) ? true : false;
    }
    if (type == 'max3decimal') {
        // check contains value after decimal
        if (value.toString().split('.')[1] && value.toString().split('.')[1].length > 3)
            return false
        else
            return true
    }
    if (type == 'minMax') {
        if (value.toString().length != 0) {
            if (value.toString().length > 6)
                return false
            else if (value.toString().length < 6)
                return false
            else
                return true
        }
        else
            return true
    }
}

begin()

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

// Image POP-UP
function onClick(element) {
    document.getElementById("img01").src = element.src;
    document.getElementById("modal01").style.display = "block";
}

// Add Net Weight
function fnCalculate() {
    var txt1 = $('.gross').val()
    var txt2 = $('.stone').val() == '' ? '0' : $('.stone').val()
    var txt3 = $('.cstone').val() == '' ? '0' : $('.cstone').val()
    var res = parseFloat(txt1) - parseFloat(txt2) - parseFloat(txt3);
    if (isNaN(res) && txt1 != '') {
        $('.net').val(txt1);
    } else if (isNaN(res) && txt2 != '') {
        $('.net').val(txt1);
    } else if (isNaN(res) && txt3 != '') {
        $('.net').val(txt1);
    } else {
        if (res >= 0) {
            $('.net').val(res.toFixed(3));
        } else {
            toastr.error('Please Change The Stone Weight / Color Stone Weight')
            $('.net').val("");
        }
    }
}

// Update Net Weight
function fnCalculateUpdate() {
    var txt1 = $('.updategross').val()
    var txt2 = $('.updatestone').val() == '' ? '0' : $('.updatestone').val()
    var txt3 = $('.updatecstone').val() == '' ? '0' : $('.updatecstone').val()
    var res = parseFloat(txt1) - parseFloat(txt2) - parseFloat(txt3);
    if (isNaN(res) && txt1 != '') {
        $('.updatenet').val(txt1);
    } else if (isNaN(res) && txt2 != '') {
        $('.updatenet').val(txt1);
    } else if (isNaN(res) && txt3 != '') {
        $('.updatenet').val(txt1);
    } else {
        if (res >= 0) {
            $('.updatenet').val(res.toFixed(3));
        } else {
            toastr.error('Please Change The Stone Weight / Color Stone Weight')
            $('.updatenet').val("");
        }
    }
}

// Print PDF sending data to Server
$(document).ready(function () {
    $('#printPDF').click(function () {
        var t = document.getElementById("designResultBody");
        var trs = t.getElementsByTagName("tr");
        var tds = null;
        let designArr = []
        for (var i = 0; i < trs.length; i++) {
            tds = trs[i].getElementsByTagName("td");
            designArr.push(tds[1].textContent)
        }

        let body = { designList: designArr }

        fetch(api_endpoint + 'design/generatePDF', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': localStorage.getItem('access_token')
            },
            body: JSON.stringify(body)
        })
            .then(response => response.blob())
            .then(response => {
                const blob = new Blob([response], { type: 'application/pdf' });
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = "design.pdf";
                document.body.appendChild(a);
                a.click();
            })
    })

    $("#designResultBody").on('click', '.btnDelete', function () {
        $(this).closest('tr').remove();
    });
})


// generate selected Design

$('#generatePDF').on('click', function () {
    try {
        $('.loading').show();
        const checkboxes = document.querySelectorAll('input[name="designSelect"]:checked');
        let Ids = []
        if (checkboxes.length == 0) {
            toastr.error('No Design Selected')
        }
        else {
            checkboxes.forEach(checkbox => {
                Ids.push(checkbox.id.split('_')[1])
            })

            if (Ids.length > 0) {
                getPDFDesigns(Ids)
            }
        }
    } catch (error) {
        toastr.error('Something went wrong')
    } finally {
        // $('.loading').hide()
    }
});

// Get selected design pdf file
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


async function getPDFDesigns(IDs) {
    try {
        let ids = IDs
        await fetch(api_endpoint + 'design/savedesignpdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ids })
        })
            .then(response => response.blob())
            .then(response => {
                const blob = new Blob([response], { type: 'application/pdf' });
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = "Design-" + getFormattedTime() + ".pdf";
                document.body.appendChild(a);
                a.click();
            })
    } catch (error) {
        console.error(error)
    } finally {
        document.getElementById('select-all').checked = false;
    }
}


// Filter record by size and weight range
$('#filterData').on('click', async function () {
    try {
        let itemStatusSelect = $('#DateTableDesignList #itemStatusSelect option:selected').val()
        let categorySelect = $('#DateTableDesignList #categoryId option:selected').val()
        let url = 'filtergrwtitemstatus'
        let body = { categoryId: categorySelect, itemStatus: itemStatusSelect }
        if ($('#fromGrwt').val() != '' || $('#toGrwt').val() != '') {
            let fromGrwt = parseFloat($('#fromGrwt').val())
            let toGrwt = parseFloat($('#toGrwt').val())

            if ((isNaN(fromGrwt) && isNaN(toGrwt)) || (fromGrwt > toGrwt)) {
                toastr.error('Please enter valid range');
                return
            }
            fromGrwt = isNaN(fromGrwt) ? undefined : fromGrwt
            toGrwt = isNaN(toGrwt) ? undefined : toGrwt

            body = { ...body, fromGrwt: fromGrwt, toGrwt: toGrwt };
        }

        let response = await fetch(api_endpoint + 'design/' + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        let res = await response.json()
        if (res.status) {
            designs = res.data
        } else {
            designs = []
        }
        var table = $('#dataTable').DataTable()
        table.clear()
        table.rows.add(designs)
        table.draw(false)
        await getTotalByStatus()
    } catch (error) {
        console.log(error);
    } finally {
        $('#FilterDesignModal').modal('hide');
        $('.loading').hide();
        $('#fromGrwt').val('');
        $('#toGrwt').val('');
        $('#fromdiamondwt').val('');
        $('#todiamondwt').val('');
        $('#fromSize').val('');
        $('#toSize').val('');
        $('#FilterDesignModal #itemId').val('');
        $('#FilterDesignModal #itemStatusSelectFilter').val('');
    }
})


async function deleteDesigns(IDs) {
    try {
        let ids = IDs
        let response = await fetch(api_endpoint + 'design/deleteselecteddesign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: ids })
        })
        let data = await response.json()
        if (response.status == 200) {
            if (data.status) {
                await getDesigns()
                var table = $('#dataTable').DataTable()
                table.clear();
                table.rows.add(designs.rows);
                table.draw(false);
                await getTotalByStatus()
                toastr.success(data.message)
            }
            else {
                toastr.error(data.message)
            }
        }
    } catch (error) {
        console.error(error)
    } finally {
        document.getElementById('select-all').checked = false;
        // $('.loading').hide()
    }
}

$('#DeleteAll').on('click', function () {
    try {
        // $('.loading').show();
        const checkboxes = document.querySelectorAll('input[name="designSelect"]:checked');
        let Ids = []
        if (checkboxes.length == 0) {
            toastr.error('No Design Selected')
        }
        else {
            checkboxes.forEach(checkbox => {
                Ids.push(checkbox.id.split('_')[1])
            })

            if (Ids.length > 0) {
                deleteDesigns(Ids)
            }
        }
    } catch (error) {
        toastr.error('Something went wrong')
    } finally {
        // $('.loading').hide()
    }
});

async function getTotalByStatus() {
    let table = $('#dataTable').DataTable()
    let designsArr = table.rows({ search: 'applied' }).data().toArray()
    let totalGrWt = designsArr.reduce((a, b) => { let grossWt = b.grossWt === null || b.grossWt === undefined ? 0.0 : parseFloat(b.grossWt); return a + grossWt }, 0).toFixed(3)
    
    $('#totalGrWt').text(totalGrWt)
  }