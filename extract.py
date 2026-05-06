import PyPDF2
reader = PyPDF2.PdfReader('diseño.pdf')
count = 0
for page in reader.pages:
    for image_file_object in page.images:
        with open(f"img_{count}_{image_file_object.name}", "wb") as fp:
            fp.write(image_file_object.data)
        count += 1
