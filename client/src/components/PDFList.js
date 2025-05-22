import { Share as ShareIcon } from '@mui/icons-material';
import SharePDF from './SharePDF';

function PDFList() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const handleShareClick = (pdf) => {
    setSelectedPDF(pdf);
    setShareDialogOpen(true);
  };

  return (
    <>
      <ListItem
        secondaryAction={
          <Stack direction="row" spacing={1}>
            <IconButton
              edge="end"
              onClick={() => handleShareClick(pdf)}
              title={t('sharePDF.title')}
            >
              <ShareIcon />
            </IconButton>
          </Stack>
        }
      >
      </ListItem>

      <SharePDF
        open={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setSelectedPDF(null);
        }}
        pdfId={selectedPDF?._id}
        pdfName={selectedPDF?.name}
      />
    </>
  );
}

export default PDFList; 