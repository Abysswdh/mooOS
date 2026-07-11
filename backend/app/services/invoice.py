import os
import tempfile
from reportlab.lib.pagesizes import A5
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

def generate_supplier_invoice(order, recipient=None) -> str:
    """Generate a PDF invoice for a feed purchase order."""
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"Invoice_{order.po_number}.pdf")
    
    c = canvas.Canvas(file_path, pagesize=A5)
    width, height = A5
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, height - 50, "PURCHASE ORDER INVOICE")
    
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 70, f"No. PO: {order.po_number}")
    if order.confirmed_at:
        c.drawString(40, height - 85, f"Tanggal: {order.confirmed_at.strftime('%d %B %Y')}")
    
    # Cooperative Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, height - 120, "Pembeli:")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 135, "Koperasi Harapan Baru")
    
    # Supplier Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(200, height - 120, "Supplier:")
    c.setFont("Helvetica", 10)
    c.drawString(200, height - 135, str(order.accepted_by))
    
    # Divider
    c.line(40, height - 150, width - 40, height - 150)
    
    # Order Items
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, height - 170, "Deskripsi")
    c.drawString(180, height - 170, "Jumlah")
    c.drawString(250, height - 170, "Harga")
    c.drawString(320, height - 170, "Total")
    
    c.line(40, height - 175, width - 40, height - 175)
    
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 195, f"Pakan {order.feed_type}")
    c.drawString(180, height - 195, f"{order.quantity_kg:,.0f} kg")
    c.drawString(250, height - 195, f"Rp{order.max_price_per_kg:,.0f}")
    c.drawString(320, height - 195, f"Rp{order.total_max_price:,.0f}")
    
    # Total Box
    c.line(40, height - 215, width - 40, height - 215)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(200, height - 235, "Total Tagihan:")
    c.drawString(320, height - 235, f"Rp{order.total_max_price:,.0f}")
    
    # Footer
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 275, "Status: Menunggu Pembayaran")
    
    if order.expires_at:
        c.drawString(40, height - 290, f"Batas Waktu: {order.expires_at.strftime('%d %B %Y')}")
    
    c.save()
    return file_path
