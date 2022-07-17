// Category Code
let categorys = []
let selectedCategory;
let categoryFormFields = [
  {
    'displayName': 'Category Name',
    'fieldName': 'categoryName',
    'validations': [
      { 'type': 'required', 'message': 'Category Name is Required' },
    ]
  },
  {
    'displayName': 'Category Prefix',
    'fieldName': 'categoryPrefix',
    'validations': [
      { 'type': 'required', 'message': 'Category Prefix is Required' },
      { 'type': 'alphanumeric', 'message': 'Category Prefix should be alphanumeric' }
    ]
  }
]

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

async function validateForm(form, field = null, validate = true) {
  for (let i = 0; i < categoryFormFields.length; i++) {
    const formField = categoryFormFields[i];
    if (formField.fieldName == field) {
      let element = document.querySelector('#' + form + ' #' + formField.fieldName)

      if (validate) {
        let valid = true
        for (let j = 0; j < formField.validations.length; j++) {
          const validation = formField.validations[j];
          if (valid && await allValidations(validation.type, element.value))
            continue;

          element.classList.add('border-invalid');
          element.classList.remove('border-0')
          let errorMessage = validation.message
          document.querySelector('#' + form + ' #' + field + '_error')
            .innerHTML = errorMessage
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
        categorys.rows.map(category => { category.createdAt = new Date(category.createdAt).toLocaleString() })
        let categories = categorys.rows
        var select = $("#addItemModal .modal-body > .card-body #itemCategoryModal");
        select.empty();
        $.each(categories, function (index, json) {
          select.append($("<option></option>").attr("value", json.id).text(json.name));
        });
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

async function setDataTableCategory() {
  var table = $('#dataTableCategory').DataTable({
    "data": categorys.rows,
    "columnDefs": [
      { "className": "dt-center", "targets": "_all" }
    ],
    "columns": [
      {
        "width": "10%",
        "render": function (data, type, full, meta) {
          return meta.row + 1;
        }
      },
      {
        "width": "30%",
        "data": "categoryName",
      },
      {
        "width": "30%",
        "data": "categoryPrefix",
      },
      {
        "orderable": false,
        "width": "20%",
        "data": null,
        "render": function (data, type, row) {
          return '<button id="update_category_button" style= "margin-right:4px;" type="button" class="btn btn-info btn-sm" data-toggle="tooltip" title="Update Category"><i class="fas fa-pencil-alt" aria-hidden="true"></i></button>' + ' <button id="delete_category_button" type="button" class="btn btn-danger btn-sm" data-toggle="tooltip" title="Delete Category"><i class="far fa-trash-alt" aria-hidden="true"></i></button>';
        }
      },
    ],
    "bDeferRender": true,
    "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
  });

  $('#dataTableCategory tbody').on('click', 'button', async function () {
    let action = this.id;
    let tr = $(this).closest('tr');
    let row = table.row(tr);
    if (action == 'update_category_button') {
      selectedCategory = row.data()
      document.querySelector('#updateCategoryModal .modal-body > .card-body #categoryName').value = selectedCategory.categoryName
      document.querySelector('#updateCategoryModal .modal-body > .card-body #categoryPrefix').value = selectedCategory.categoryPrefix

      for (let i = 0; i < categoryFormFields.length; i++) {
        const formField = categoryFormFields[i];
        await validateForm('updateCategoryModal', formField.fieldName, true)
      }
      $('#updateCategoryModal').modal('show')
    } else if (action == 'delete_category_button') {
      selectedCategory = row.data()
      $('#deleteCategoryModal').modal('show')
    }
  });
}

async function addCategoryModal() {
  // reset form fields
  for (let i = 0; i < categoryFormFields.length; i++) {
    const formField = categoryFormFields[i];

    await validateForm('addCategoryModal', formField.fieldName)
    document.querySelector('#addCategoryModal #' + formField.fieldName + '_error').innerHTML = ''
    let htmlElement = document.querySelector('#addCategoryModal #' + formField.fieldName)
    htmlElement.classList.remove('border-invalid');
    htmlElement.classList.add('border-0');
    htmlElement.value = '';
  }
  $('#addCategoryModal').modal('show')
}

async function addCategory() {
  try {
    $('.loading').show()
    let valid = true;
    let fieldNames = [];

    for (let i = 0; i < categoryFormFields.length; i++) {
      const formField = categoryFormFields[i];
      fieldNames.push(formField.fieldName)
      let newValidation = await validateForm('addCategoryModal', formField.fieldName)
      valid = valid && newValidation
    }
    if (valid) {
      let body = {}
      fieldNames.forEach(field => {
        if (document.querySelector('#addCategoryModal #' + field).value == '')
          body[field] = null
        else
          body[field] = document.querySelector('#addCategoryModal #' + field).value
      });
      if (body.categoryName === "" || body.categoryName === undefined || body.categoryName === null) {
        return toastr.error('Category Name should not be empty.')
      }
      let response = await fetch(api_endpoint + 'category/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': localStorage.getItem('access_token')
        },
        body: JSON.stringify(body)
      })
      let data = await response.json()
      let newCatgeory;
      if (response.status == 200) {
        if (data.status) {
          $('#addCategoryModal').modal('hide')
          newCatgeory = data.data
          await getCategorys()
          var table = $('#dataTableCategory').DataTable()
          table.clear();
          table.rows.add(categorys.rows);
          table.draw(false);
          toastr.success(data.message)
          $('.loading').hide();
        }
        else {
          $('.loading').show()
          toastr.error(data.message)
          return
        }
        return newCatgeory;
      }
      else if (response.status == 401) {
        $('.loading').hide()
        notAuthenticated()
      }
      else if (response.status == 410) {
        $('.loading').hide()
        toastr.error('Error in Request')
      }
      else {
        $('.loading').hide()
        toastr.error('Something went wrong')
      }
    }
  }
  catch (err) {
    console.log(err)
    toastr.error('Something went wrong')
  } finally {
    $('.loading').hide();
  }
}

async function updateCategory() {
  try {
    $('.loading').show()
    let valid = true;
    let fieldNames = [];
    for (let i = 0; i < categoryFormFields.length; i++) {
      const formField = categoryFormFields[i];
      fieldNames.push(formField.fieldName)
      let newValidation = await validateForm('updateCategoryModal', formField.fieldName)
      valid = valid && newValidation
    }

    if (valid && selectedCategory) {
      let body = {}
      let value;
      fieldNames.forEach(field => {
        value = document.querySelector('#updateCategoryModal #' + field).value
        if (value != undefined && value != null && value != '')
          body[field] = value
      });

      let response = await fetch(api_endpoint + 'category/' + selectedCategory.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'access_token': localStorage.getItem('access_token')
        },
        body: JSON.stringify(body)
      })
      let data = await response.json()
      if (response.status == 200) {
        if (data.status) {
          await getCategorys()
          var table = $('#dataTableCategory').DataTable()
          table.clear();
          table.rows.add(categorys.rows);
          table.draw(false);
          toastr.success(data.message)
          $('.loading').hide()
        }
        else {
          $('.loading').hide()
          toastr.error(data.message)
          return
        }
        $('#updateCategoryModal').modal('hide')
        return true;
      }
      else if (response.status == 401) {
        $('.loading').hide()
        notAuthenticated()
      }
      else if (response.status == 410) {
        toastr.error('Error in Request')
      }
      else {
        $('.loading').hide()
        toastr.error('Something went wrong')
      }
      $('#updateDesignModal').modal('hide')
    }
  }
  catch (err) {
    $('.loading').hide()
    console.log(err)
    toastr.error('Something went wrong')
  } finally {
    $('.loading').hide();
  }
}

async function deleteCategory() {
  try {
    $('.loading').show()
    if (selectedCategory) {
      let response = await fetch(api_endpoint + 'category/' + selectedCategory.id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      let data = await response.json()
      if (response.status == 200) {
        if (data.status) {
          await getCategorys()
          var table = $('#dataTableCategory').DataTable()
          table.clear();
          table.rows.add(categorys.rows);
          table.draw(false);
          $('.loading').hide()
          toastr.success(data.message)
        }
        else {
          $('.loading').hide()
          toastr.error(data.message)
        }
      }
      else if (response.status == 401) {
        $('.loading').hide()
        notAuthenticated()
      }
      else if (response.status == 410) {
        $('.loading').hide()
        toastr.error('Error in Request')
      }
      else {
        $('.loading').hide()
        toastr.error('Something went wrong')
      }
    }
  }
  catch (err) {
    $('.loading').hide()
    console.log(err)
    toastr.error('Something went wrong')
  }
  finally {
    $('.loading').hide()
    $('#deleteCategoryModal').modal('hide')
  }
}

$(document).ready(async function () {
  await getCategorys()
  setDataTableCategory()
})